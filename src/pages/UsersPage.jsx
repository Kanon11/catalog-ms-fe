import { useCallback, useEffect, useState } from 'react'
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
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { listUsers, createUser, updateUser, deleteUser } from '../services/userService'
import { listRoles } from '../services/roleService'

export function UsersPage() {
  const { message } = App.useApp()

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  // editing: null = closed; {} = create; { ...user } = edit.
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const isEdit = editing?.id != null

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await listUsers())
    } catch (err) {
      message.error(err.message)
    }
  }, [message])

  // Initial load of users + roles. State set inside callbacks, guarded on unmount.
  useEffect(() => {
    let active = true
    Promise.all([listUsers(), listRoles()])
      .then(([userList, roleList]) => {
        if (!active) return
        setUsers(userList)
        setRoles(roleList)
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
  }, [message])

  // Sync the form when the dialog opens (create => blanks, edit => the user's values).
  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        username: editing.username ?? '',
        password: '',
        enabled: editing.enabled ?? true,
        roles: editing.roles ?? [],
      })
    }
  }, [editing, form])

  async function handleSubmit() {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return // validation errors render inline
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateUser(editing.id, {
          password: values.password, // userService omits it when blank
          enabled: values.enabled,
          roles: values.roles ?? [],
        })
        message.success('User updated')
      } else {
        await createUser({
          username: values.username.trim(),
          password: values.password,
          roles: values.roles ?? [],
        })
        message.success('User created')
      }
      setEditing(null)
      await loadUsers()
    } catch (err) {
      message.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record) {
    try {
      await deleteUser(record.id)
      message.success('User deleted')
      await loadUsers()
    } catch (err) {
      message.error(err.message)
    }
  }

  const roleOptions = roles.map((role) => ({ label: role.name, value: role.name }))

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 90, sorter: (a, b) => a.id - b.id },
    {
      title: 'Username',
      dataIndex: 'username',
      sorter: (a, b) => (a.username ?? '').localeCompare(b.username ?? ''),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      width: 130,
      filters: [
        { text: 'Enabled', value: true },
        { text: 'Disabled', value: false },
      ],
      onFilter: (value, record) => record.enabled === value,
      render: (enabled) =>
        enabled ? <Tag color="green">Enabled</Tag> : <Tag color="red">Disabled</Tag>,
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      render: (userRoles) =>
        userRoles?.length ? (
          <Space size={[0, 4]} wrap>
            {userRoles.map((role) => (
              <Tag key={role} color="purple">
                {role}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
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
            title="Delete user"
            description={`Delete "${record.username}"?`}
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
    },
  ]

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Users
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
          Add user
        </Button>
      </Flex>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} users` }}
      />

      <Modal
        title={isEdit ? 'Edit user' : 'Add user'}
        open={editing != null}
        onOk={handleSubmit}
        onCancel={() => setEditing(null)}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="username"
            label="Username"
            rules={isEdit ? [] : [{ required: true, message: 'Username is required' }]}
          >
            {/* Username is immutable once created (the API has no field for it). */}
            <Input autoFocus={!isEdit} disabled={isEdit} />
          </Form.Item>

          <Form.Item
            name="password"
            label={isEdit ? 'New password' : 'Password'}
            rules={isEdit ? [] : [{ required: true, message: 'Password is required' }]}
            extra={isEdit ? 'Leave blank to keep the current password.' : undefined}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          {isEdit && (
            <Form.Item name="enabled" label="Enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}

          <Form.Item name="roles" label="Roles">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select roles"
              options={roleOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
