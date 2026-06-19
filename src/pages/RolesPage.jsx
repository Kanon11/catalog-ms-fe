import { useEffect, useState } from 'react'
import { App, Table, Tag, Typography } from 'antd'
import { listRoles } from '../services/roleService'

// Read-only: the API exposes GET /roles only. Roles are seeded/managed server-side.
export function RolesPage() {
  const { message } = App.useApp()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listRoles()
      .then((data) => {
        if (active) setRoles(data)
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

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 90, sorter: (a, b) => a.id - b.id },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
      render: (name) => <Tag color="purple">{name}</Tag>,
    },
  ]

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Roles
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Roles are managed by the system and are read-only here.
      </Typography.Paragraph>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={roles}
        loading={loading}
        size="middle"
        pagination={false}
      />
    </>
  )
}
