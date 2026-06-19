import { useEffect, useState } from 'react'
import { App, Alert, Button, Flex, Input, Space, Typography } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { getSettings, updateSettings } from '../services/settingService'

// Settings are a flat string->string map. Existing keys are value-editable; new
// key/value pairs can be added. The API merges on save and cannot delete keys, so
// removal is only offered for not-yet-saved new rows.
export function SettingsPage() {
  const { message } = App.useApp()

  const [existing, setExisting] = useState([]) // [{ key, value }] — keys fixed
  const [newRows, setNewRows] = useState([]) // [{ key, value }] — editable keys
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  function applyLoaded(map) {
    const rows = Object.entries(map ?? {})
      .map(([key, value]) => ({ key, value: String(value ?? '') }))
      .sort((a, b) => a.key.localeCompare(b.key))
    setExisting(rows)
    setNewRows([])
  }

  useEffect(() => {
    let active = true
    getSettings()
      .then((map) => {
        if (active) applyLoaded(map)
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

  function setExistingValue(key, value) {
    setExisting((rows) => rows.map((r) => (r.key === key ? { ...r, value } : r)))
  }

  function setNewField(index, field, value) {
    setNewRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  async function handleSave() {
    const cleanedNew = newRows.map((r) => ({ key: r.key.trim(), value: r.value }))

    // Validate new rows: non-empty, unique against existing and each other.
    const existingKeys = new Set(existing.map((r) => r.key))
    const seen = new Set()
    for (const r of cleanedNew) {
      if (!r.key) {
        message.error('New settings need a key.')
        return
      }
      if (existingKeys.has(r.key) || seen.has(r.key)) {
        message.error(`Duplicate key: ${r.key}`)
        return
      }
      seen.add(r.key)
    }

    const payload = {}
    existing.forEach((r) => {
      payload[r.key] = r.value
    })
    cleanedNew.forEach((r) => {
      payload[r.key] = r.value
    })

    setSaving(true)
    try {
      const updated = await updateSettings(payload)
      applyLoaded(updated)
      message.success('Settings saved')
    } catch (err) {
      message.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Settings
      </Typography.Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Saving merges these values into the server. Keys cannot be deleted via the API."
      />

      <Flex vertical gap="small" style={{ maxWidth: 640 }}>
        {existing.map((row) => (
          <Flex key={row.key} gap="small" align="center">
            <Input value={row.key} disabled style={{ flex: '0 0 280px' }} />
            <Input
              value={row.value}
              placeholder="Value"
              onChange={(e) => setExistingValue(row.key, e.target.value)}
            />
            {/* Spacer to align with the remove button on new rows. */}
            <span style={{ width: 32, flex: '0 0 32px' }} />
          </Flex>
        ))}

        {newRows.map((row, index) => (
          <Flex key={index} gap="small" align="center">
            <Input
              value={row.key}
              placeholder="New key"
              style={{ flex: '0 0 280px' }}
              onChange={(e) => setNewField(index, 'key', e.target.value)}
            />
            <Input
              value={row.value}
              placeholder="Value"
              onChange={(e) => setNewField(index, 'value', e.target.value)}
            />
            <Button
              type="text"
              icon={<MinusCircleOutlined />}
              onClick={() => setNewRows((rows) => rows.filter((_, i) => i !== index))}
            />
          </Flex>
        ))}

        {!loading && existing.length === 0 && newRows.length === 0 && (
          <Typography.Text type="secondary">No settings yet.</Typography.Text>
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setNewRows((rows) => [...rows, { key: '', value: '' }])}
          style={{ maxWidth: 640 }}
        >
          Add setting
        </Button>
      </Flex>

      <Space style={{ marginTop: 20 }}>
        <Button type="primary" onClick={handleSave} loading={saving} disabled={loading}>
          Save changes
        </Button>
      </Space>
    </>
  )
}
