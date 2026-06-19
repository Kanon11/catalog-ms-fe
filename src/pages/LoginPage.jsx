import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/authContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Back to the page the user was blocked from, or the dashboard.
  const redirectTo = location.state?.from?.pathname || '/'

  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function onFinish({ username, password }) {
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      // ApiError.message is "Invalid credentials" on 401, or a connection hint at status 0.
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ width: 380, maxWidth: '100%' }} variant="borderless">
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>
          Catalog
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
          Sign in to your account
        </Typography.Paragraph>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} disabled={submitting}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input prefix={<UserOutlined />} autoComplete="username" autoFocus />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
