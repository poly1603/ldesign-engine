import { Component, createSignal, For } from 'solid-js'
import { useEventListener, useEventEmitter } from '@ldesign/engine-solid'

interface EventLogItem {
  id: number
  event: string
  payload: any
  timestamp: string
}

const EventDemo: Component = () => {
  const [logs, setLogs] = createSignal<EventLogItem[]>([])
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
      message: 'Hello from Solid!',
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
    <div class="event-demo">
      <div style={{ display: 'flex', gap: '1rem', 'margin-bottom': '1rem' }}>
        <button onClick={handleEmitEvent}>发送自定义事件</button>
        <button onClick={handleButtonClick}>按钮点击事件</button>
        <button onClick={clearLogs}>清空日志</button>
      </div>

      <div class="event-log">
        {logs().length === 0 ? (
          <div class="event-log-empty">暂无事件日志</div>
        ) : (
          <For each={logs()}>
            {(log) => (
              <div class="event-log-item">
                <strong>{log.event}</strong> @ {log.timestamp}
                <br />
                <code>{JSON.stringify(log.payload, null, 2)}</code>
              </div>
            )}
          </For>
        )}
      </div>
    </div>
  )
}

export default EventDemo


