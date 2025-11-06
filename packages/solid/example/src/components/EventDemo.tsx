import { Component, createSignal, createEffect } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'
import './DemoCard.css'

interface EventLogEntry {
  timestamp: string
  event: string
  data: string
}

const EventDemo: Component = () => {
  const engine = useEngine()
  const [eventName, setEventName] = createSignal('custom:event')
  const [eventData, setEventData] = createSignal('Hello from Solid!')
  const [eventLog, setEventLog] = createSignal<EventLogEntry[]>([])

  createEffect(() => {
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

    const customUnsub = engine.events.on('custom:event', (data: any) => {
      addLog('custom:event', data)
    })

    const welcomeUnsub = engine.events.on('app:welcome', (data: any) => {
      addLog('app:welcome', data)
    })

    const loginUnsub = engine.events.on('user:login', (data: any) => {
      addLog('user:login', data)
    })

    const logoutUnsub = engine.events.on('user:logout', (data: any) => {
      addLog('user:logout', data)
    })

    return () => {
      customUnsub()
      welcomeUnsub()
      loginUnsub()
      logoutUnsub()
    }
  })

  const emitEvent = () => {
    if (eventName()) {
      engine.events.emit(eventName(), eventData())
    }
  }

  const emitAsyncEvent = async () => {
    if (eventName()) {
      await engine.events.emitAsync(eventName(), eventData())
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
              value={eventName()}
              onInput={(e) => setEventName(e.currentTarget.value)}
              type="text"
              placeholder="输入事件名称"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>事件数据:</label>
            <input
              value={eventData()}
              onInput={(e) => setEventData(e.currentTarget.value)}
              type="text"
              placeholder="输入事件数据"
              class="input"
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

        {eventLog().length > 0 && (
          <div class="log">
            <strong>事件日志:</strong>
            <div class="log-entries">
              {eventLog().map((entry) => (
                <div class="log-entry">
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

export default EventDemo

