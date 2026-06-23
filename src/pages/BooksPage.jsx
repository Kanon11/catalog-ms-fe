import { useEffect, useState } from 'react'
import {
  App,
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/authContext'
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
} from '../services/bookService'

const DEFAULT_PAGE_SIZE = 10

export function BooksPage() {
  const { hasRole } = useAuth()
  // Writes are ADMIN/MANAGER only; SUPERVISOR is read-only (mirrors products).
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

  // editing: null = closed; {} = create; { ...book } = edit.
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  // Fetch whenever the page, size, or reload key changes. State is set inside the
  // promise callbacks (never synchronously) and guarded against a stale/unmounted load.
  useEffect(() => {
    let active = true
    listBooks(page, size)
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
        title: editing.title ?? '',
        author: editing.author ?? '',
        isbn: editing.isbn ?? '',
        price: editing.price ?? null,
        description: editing.description ?? '',
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
      if (editing.id != null) {
        await updateBook(editing.id, values)
        message.success('Book updated')
        setEditing(null)
        reloadCurrentPage()
      } else {
        await createBook(values)
        message.success('Book created')
        setEditing(null)
        // New book sorts last (by id) — jump to the page it lands on.
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
      await deleteBook(record.id)
      message.success('Book deleted')
      setLoading(true)
      // If we just removed the only row on a non-first page, step back a page.
      if (data.length === 1 && page > 1) setPage(page - 1)
      else setReloadKey((k) => k + 1)
    } catch (err) {
      message.error(err.message)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    { title: 'Title', dataIndex: 'title' },
    { title: 'Author', dataIndex: 'author' },
    { title: 'ISBN', dataIndex: 'isbn', width: 160 },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 140,
      align: 'right',
      render: (value) =>
        typeof value === 'number'
          ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : (value ?? '—'),
    },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
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
            title="Delete book"
            description={`Delete "${record.title}"?`}
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
          Books
        </Typography.Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
            Add book
          </Button>
        )}
      </Flex>

      <Table
        rowKey="id"
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
          showTotal: (t) => `${t} books`,
        }}
      />

      <Modal
        title={editing?.id != null ? 'Edit book' : 'Add book'}
        open={editing != null}
        onOk={handleSubmit}
        onCancel={() => setEditing(null)}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            name="author"
            label="Author"
            rules={[{ required: true, message: 'Author is required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="isbn" label="ISBN">
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Price is required' }]}
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
