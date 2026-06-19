import { useNavigate } from 'react-router-dom'
import { Button, Result } from 'antd'

// Shown when an authenticated user hits a route their role can't access (backend 403).
export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Result
        status="403"
        title="403"
        subTitle="You don't have permission to access this page."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back to dashboard
          </Button>
        }
      />
    </div>
  )
}
