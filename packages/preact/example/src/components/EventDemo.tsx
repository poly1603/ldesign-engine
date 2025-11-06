import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'
import type { CoreEngine, Unsubscribe } from '@ldesign/engine-core'
import './demo-card.css'

interface EventLogEntry {
  timestamp: string
  event: string
  data: string
}

export default function EventDemo() {
  const engine: CoreEngine = useEngine()
  const [eventName, setEventName] = useState('custom:event')
  const [eventData, setEventData] = useState('Hello from Preact!')
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])

  useEffect(() => {
    const addLog = (event: string, data: any) => {
      const timestamp = new Date().toLocaleTimeString()
      setEventLog((prev) => [
        {
          timestamp,
          event,
          data: typeof data === 'object' ? JSON.stringify(data) : String(data),
        },
        ...prev,
      ].slice(0, 20))
    }

    const unsubscribers: Unsubscribe[] = []

    unsubscribers.push(
      engine.events.on('custom:event', (data: any) => addLog('custom:event', data))
    )

    unsubscribers.push(
      engine.events.on('app:welcome', (data: any) => addLog('app:welcome', data))
    )

    unsubscribers.push(
      engine.events.on('user:login', (data: any) => addLog('user:login', data))
    )

    unsubscribers.push(
      engine.events.on('user:logout', (data: any) => addLog('user:logout', data))
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [])

  const emitEvent = () => {
    if (eventName) {
      engine.events.emit(eventName, eventData)
    }
  }

  const emitAsyncEvent = async () => {
    if (eventName) {
      await engine.events.emitAsync(eventName, eventData)
      alert('异步事件触发完成!')
    }
  }

  const clearLog = () => {
    setEventLog([])
  }

  return (
    <div class="demo-card">
      <h2>📡 事件系统演示</h2>
      <div class="demo-content">
        <div class="event-controls">
          <div class="input-group">
            <label>事件名称:</label>
            <input
              type="text"
              placeholder="输入事件名称"
              class="input"
              value={eventName}
              onInput={(e: any) => setEventName(e.target.value)}
            />
          </div>
          <div class="input-group">
            <label>事件数据:</label>
            <input
              type="text"
              placeholder="输入事件数据"
              class="input"
              value={eventData}
              onInput={(e: any) => setEventData(e.target.value)}
            />
          </div>
        </div>

        <div class="actions">
          <button onClick={emitEvent} class="btn btn-primary">
            触发事件
          </button>
          <button onClick={emitAsyncEvent} class="btn btn-secondary">
            触发异步事件
          </button>
          <button onClick={clearLog} class="btn btn-secondary">
            清空日志
          </button>
        </div>

        {eventLog.length > 0 && (
          <div class="log">
            <strong>事件日志:</strong>
            <div class="log-entries">
              {eventLog.map((entry, index) => (
                <div key={index} class="log-entry">
                  <span class="timestamp">{entry.timestamp}</span>
                  <span class="event-name">{entry.event}</span>
                  <span class="event-data">{entry.data}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div class="info">
          <p>💡 提示: 所有事件都会被 logger 插件记录到控制台</p>
        </div>
      </div>
    </div>
  )
}



