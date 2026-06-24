import { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/authContext'
import {
  listWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
} from '../services/workerService'
import { listFactories } from '../services/factoryService'

const DEFAULT_PAGE_SIZE = 10

export function WorkersPage() {
  const { hasRole } = useAuth()
  // Writes are ADMIN/MANAGER only; SUPERVISOR is read-only (mirrors books/products).
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

  // Factory lookup, so the table can show names instead of raw ids and the form
  // can offer a picker. Factories are paginated; one large page covers the demo set.
  const [factories, setFactories] = useState([])

  // editing: null = closed; {} = create; { ...worker } = edit.
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const factoryName = useMemo(() => {
    const map = new Map(factories.map((f) => [f.id, f.name]))
    return (id) => map.get(id) ?? (id != null ? `#${id}` : '—')
  }, [factories])

  const factoryOptions = useMemo(
    () => factories.map((f) => ({ label: `${f.name} (#${f.id})`, value: f.id })),
    [factories],
  )

  // Load the factory lookup once on mount.
  useEffect(() => {
    let active = true
    listFactories(1, 100)
      .then((res) => {
        if (active) setFactories(res.content ?? [])
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
    listWorkers(page, size)
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

  // Sync the form with the row being edited whenever the dialog opens.
  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        nid: editing.nid ?? '',
        workerName: editing.workerName ?? '',
        mobileNo: editing.mobileNo ?? '',
        factoryId: editing.factoryId ?? undefined,
      })
    }
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
    setSaving(true)
    try {
      if (editing.workerId != null) {
        await updateWorker(editing.workerId, values)
        message.success('Worker updated')
        setEditing(null)
        reloadCurrentPage()
      } else {
        await createWorker(values)
        message.success('Worker created')
        setEditing(null)
        // New worker sorts last (by workerId) — jump to the page it lands on.
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
      await deleteWorker(record.workerId)
      message.success('Worker deleted')
      setLoading(true)
      // If we just removed the only row on a non-first page, step back a page.
      if (data.length === 1 && page > 1) setPage(page - 1)
      else setReloadKey((k) => k + 1)
    } catch (err) {
      message.error(err.message)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'workerId', width: 90 },
    { title: 'Name', dataIndex: 'workerName' },
    { title: 'NID', dataIndex: 'nid', width: 200 },
    { title: 'Mobile', dataIndex: 'mobileNo', width: 180 },
    { title: 'Factory', dataIndex: 'factoryId', render: (id) => factoryName(id) },
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
            title="Delete worker"
            description={`Delete "${record.workerName}"?`}
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
          Workers
        </Typography.Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
            Add worker
          </Button>
        )}
      </Flex>

      <Table
        rowKey="workerId"
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
          showTotal: (t) => `${t} workers`,
        }}
      />

      <Modal
        title={editing?.workerId != null ? 'Edit worker' : 'Add worker'}
        open={editing != null}
        onOk={handleSubmit}
        onCancel={() => setEditing(null)}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="workerName"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            name="nid"
            label="NID"
            rules={[{ required: true, message: 'NID is required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="mobileNo" label="Mobile">
            <Input />
          </Form.Item>
          <Form.Item name="factoryId" label="Factory">
            <Select
              showSearch
              allowClear
              placeholder="Select a factory"
              options={factoryOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
