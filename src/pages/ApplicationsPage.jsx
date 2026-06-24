import { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  DatePicker,
  Dropdown,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../auth/authContext'
import {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../services/applicationService'
import { listWorkers } from '../services/workerService'
// exportReport pulls in heavy libs (xlsx, jspdf); it's dynamically imported in
// handleDownload so it only loads when a user actually exports a report.

const DEFAULT_PAGE_SIZE = 10
const DATE_FORMAT = 'YYYY-MM-DD'
// Backend caps page size at 100; we page through at this size to export everything.
const EXPORT_PAGE_SIZE = 100

// Columns for the exported report (resolved/flattened from the raw Application).
const EXPORT_COLUMNS = [
  { header: 'ID', key: 'applicationId' },
  { header: 'Worker', key: 'worker' },
  { header: 'Date', key: 'applicationDate' },
  { header: 'Reason for unemployment', key: 'reasonForUnemployment' },
  { header: 'Status', key: 'status' },
]

// Dropdown items; key drives which exporter runs in handleDownload.
const DOWNLOAD_ITEMS = [
  { key: 'pdf', label: 'PDF (.pdf)', icon: <FilePdfOutlined /> },
  { key: 'csv', label: 'CSV (.csv)', icon: <FileTextOutlined /> },
  { key: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
]

// Application status values come from the backend (defaults to PENDING on create).
const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]
const STATUS_COLORS = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'red' }

export function ApplicationsPage() {
  const { hasRole } = useAuth()
  // Writes are ADMIN/MANAGER only; SUPERVISOR is read-only (mirrors workers/books).
  const canWrite = hasRole('ROLE_ADMIN') || hasRole('ROLE_MANAGER')
  const { message } = App.useApp()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  // Server-side pagination state. `page` is 1-based to match the API.
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  // Bump to refetch the current page (e.g. after a mutation) without changing page/size.
  const [reloadKey, setReloadKey] = useState(0)

  // Worker lookup, so the table can show names instead of raw ids and the form
  // can offer a picker. Workers are paginated; one large page covers the demo set.
  const [workers, setWorkers] = useState([])

  // editing: null = closed; {} = create; { ...application } = edit.
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [form] = Form.useForm()

  const workerName = useMemo(() => {
    const map = new Map(workers.map((w) => [w.workerId, w.workerName]))
    return (id) => map.get(id) ?? (id != null ? `#${id}` : '—')
  }, [workers])

  const workerOptions = useMemo(
    () => workers.map((w) => ({ label: `${w.workerName} (#${w.workerId})`, value: w.workerId })),
    [workers],
  )

  // Load the worker lookup once on mount.
  useEffect(() => {
    let active = true
    listWorkers(1, 100)
      .then((res) => {
        if (active) setWorkers(res.content ?? [])
      })
      .catch((err) => {
        if (active) message.error(err.message)
      })
    return () => {
      active = false
    }
  }, [message])

  // Fetch whenever the page, size, or reload key changes. State is set inside the
  // promise callbacks (never synchronously) and guarded against a stale/unmounted load.
  useEffect(() => {
    let active = true
    listApplications(page, size)
      .then((res) => {
        if (!active) return
        setData(res.content ?? [])
        setTotal(res.totalElements ?? 0)
      })
      .catch((err) => {
        if (active) message.error(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, size, reloadKey, message])

  // Sync the form with the row being edited whenever the dialog opens. A new
  // application defaults to today + PENDING to match the backend's create defaults.
  useEffect(() => {
    if (!editing) return
    const isEdit = editing.applicationId != null
    form.setFieldsValue({
      workerId: editing.workerId ?? undefined,
      applicationDate: editing.applicationDate ? dayjs(editing.applicationDate) : dayjs(),
      reasonForUnemployment: editing.reasonForUnemployment ?? '',
      status: editing.status ?? (isEdit ? undefined : 'PENDING'),
    })
  }, [editing, form])

  function handleTableChange(pagination) {
    if (pagination.current !== page || pagination.pageSize !== size) {
      setLoading(true)
      setPage(pagination.current)
      setSize(pagination.pageSize)
    }
  }

  function reloadCurrentPage() {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  async function handleSubmit() {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return // validation errors render inline
    }
    // DatePicker yields a dayjs value; the API wants an ISO date string.
    const payload = {
      ...values,
      applicationDate: values.applicationDate ? values.applicationDate.format(DATE_FORMAT) : null,
    }
    setSaving(true)
    try {
      if (editing.applicationId != null) {
        await updateApplication(editing.applicationId, payload)
        message.success('Application updated')
        setEditing(null)
        reloadCurrentPage()
      } else {
        await createApplication(payload)
        message.success('Application created')
        setEditing(null)
        // New application sorts last (by applicationId) — jump to the page it lands on.
        const lastPage = Math.max(1, Math.ceil((total + 1) / size))
        setLoading(true)
        if (lastPage === page) setReloadKey((k) => k + 1)
        else setPage(lastPage)
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record) {
    try {
      await deleteApplication(record.applicationId)
      message.success('Application deleted')
      setLoading(true)
      // If we just removed the only row on a non-first page, step back a page.
      if (data.length === 1 && page > 1) setPage(page - 1)
      else setReloadKey((k) => k + 1)
    } catch (err) {
      message.error(err.message)
    }
  }

  // Reports cover the whole dataset, not just the visible page, so page through
  // the API until the backend reports the last page.
  async function fetchAllApplications() {
    const all = []
    let p = 1
    for (;;) {
      const res = await listApplications(p, EXPORT_PAGE_SIZE)
      all.push(...(res.content ?? []))
      if (res.last || !res.content?.length) break
      p += 1
    }
    return all
  }

  async function handleDownload({ key }) {
    setDownloading(true)
    try {
      const { exportCsv, exportExcel, exportPdf } = await import('../utils/exportReport')
      const records = await fetchAllApplications()
      // Flatten to the export columns, resolving the worker id to a name.
      const rows = records.map((r) => ({
        applicationId: r.applicationId,
        worker: workerName(r.workerId),
        applicationDate: r.applicationDate ?? '',
        reasonForUnemployment: r.reasonForUnemployment ?? '',
        status: r.status ?? '',
      }))
      const stamp = dayjs().format(DATE_FORMAT)
      if (key === 'csv') {
        exportCsv(`applications-${stamp}.csv`, EXPORT_COLUMNS, rows)
      } else if (key === 'excel') {
        exportExcel(`applications-${stamp}.xlsx`, EXPORT_COLUMNS, rows)
      } else {
        exportPdf(`applications-${stamp}.pdf`, EXPORT_COLUMNS, rows, { title: 'Applications report' })
      }
      message.success(`Exported ${rows.length} application${rows.length === 1 ? '' : 's'}`)
    } catch (err) {
      message.error(err.message)
    } finally {
      setDownloading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'applicationId', width: 90 },
    {
      title: 'Worker',
      dataIndex: 'workerId',
      render: (id) => workerName(id),
    },
    { title: 'Date', dataIndex: 'applicationDate', width: 140 },
    { title: 'Reason', dataIndex: 'reasonForUnemployment', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (value) =>
        value ? <Tag color={STATUS_COLORS[value] ?? 'default'}>{value}</Tag> : '—',
    },
  ]

  if (canWrite) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 170,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete application"
            description={`Delete application #${record.applicationId}?`}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    })
  }

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Applications
        </Typography.Title>
        <Space>
          <Dropdown
            menu={{ items: DOWNLOAD_ITEMS, onClick: handleDownload }}
            trigger={['click']}
            disabled={downloading}
          >
            <Button icon={<DownloadOutlined />} loading={downloading}>
              Download
            </Button>
          </Dropdown>
          {canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
              Add application
            </Button>
          )}
        </Space>
      </Flex>

      <Table
        rowKey="applicationId"
        columns={columns}
        dataSource={data}
        loading={loading}
        size="middle"
        onChange={handleTableChange}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} applications`,
        }}
      />

      <Modal
        title={editing?.applicationId != null ? 'Edit application' : 'Add application'}
        open={editing != null}
        onOk={handleSubmit}
        onCancel={() => setEditing(null)}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="workerId"
            label="Worker"
            rules={[{ required: true, message: 'Worker is required' }]}
          >
            <Select
              showSearch
              placeholder="Select a worker"
              options={workerOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="applicationDate"
            label="Application date"
            rules={[{ required: true, message: 'Application date is required' }]}
          >
            <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} />
          </Form.Item>
          <Form.Item name="reasonForUnemployment" label="Reason for unemployment">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Status is required' }]}
          >
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
