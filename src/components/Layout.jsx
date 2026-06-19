import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Button, Menu, Space, Typography, theme } from 'antd'
import {
  AppstoreOutlined,
  LogoutOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useAuth } from '../auth/authContext'
import { MENU } from '../config/menu'

const { Sider, Header, Content } = AntLayout

const ICONS = {
  '/products': <AppstoreOutlined />,
  '/users': <TeamOutlined />,
  '/roles': <SafetyOutlined />,
  '/settings': <SettingOutlined />,
}

// App shell for authenticated pages: role-filtered sidebar nav + header with the
// signed-in user and logout. The active page renders via <Outlet />.
export function Layout() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const items = MENU.filter((item) => item.roles.some((role) => hasRole(role))).map((item) => ({
    key: item.path,
    icon: ICONS[item.path],
    label: item.label,
  }))

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        style={{
          background: token.colorBgContainer,
          borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            paddingInline: 24,
            fontSize: 18,
            fontWeight: 700,
            color: token.colorText,
          }}
        >
          Catalog
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            paddingInline: 24,
          }}
        >
          <Space size="middle">
            <Typography.Text type="secondary">
              {user?.username}
              {user?.roles?.length ? ` · ${user.roles.join(', ')}` : ''}
            </Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Log out
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: 24 }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
