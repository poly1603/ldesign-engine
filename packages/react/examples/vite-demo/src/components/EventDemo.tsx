import React, { useState } from 'react'
import { useEventListener, useEventEmitter } from '@ldesign/engine-react'

interface EventLogItem {
  id: number
  event: string
  payload: any
  timestamp: string
}

function EventDemo() {
  const [logs, setLogs] = useState<EventLogItem[]>([])
  const emit = useEventEmitter()

  // 监听自定义事件
  useEventListener('custom:event', (payload) => {
    addLog('custom:event', payload)
  })

  useEventListener('button:clicked', (payload) => {
    addLog('button:clicked', payload)
  })

  const addLog = (event: string, payload: any) => {
    const logItem: EventLogItem = {
      id: Date.now(),
      event,
      payload,
      timestamp: new Date().toLocaleTimeString()
    }
    setLogs((prev) => [logItem, ...prev].slice(0, 10))
  }

  const handleEmitEvent = () => {
    emit('custom:event', {
      message: 'Hello from React!',
      timestamp: Date.now()
    })
  }

  const handleButtonClick = () => {
    emit('button:clicked', {
      button: 'demo-button',
      timestamp: Date.now()
    })
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="event-demo">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={handleEmitEvent}>发送自定义事件</button>
        <button onClick={handleButtonClick}>按钮点击事件</button>
        <button onClick={clearLogs}>清空日志</button>
      </div>

      <div className="event-log">
        {logs.length === 0 ? (
          <div className="event-log-empty">暂无事件日志</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="event-log-item">
              <strong>{log.event}</strong> @ {log.timestamp}
              <br />
              <code>{JSON.stringify(log.payload, null, 2)}</code>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EventDemo


