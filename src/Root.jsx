import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import { AuthProvider } from './auth/AuthProvider'
import App from './App.jsx'

// Follow the OS light/dark preference, reactively.
function usePrefersDark() {
  const [dark, setDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return dark
}

// Global providers: antd theme (brand purple + OS light/dark), antd App context
// for message/notification, router, and auth.
export function Root() {
  const dark = usePrefersDark()
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: '#722ed1', borderRadius: 8 },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}
