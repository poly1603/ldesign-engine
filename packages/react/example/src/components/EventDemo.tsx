import React, { useState, useEffect } from 'react'
import { useEngine } from '@ldesign/engine-react'
import './DemoCard.css'

interface EventLogEntry {
  timestamp: string
  event: string
  data: string
}

function EventDemo() {
  const engine = useEngine()
  const [eventName, setEventName] = useState('custom:event')
  const [eventData, setEventData] = useState('Hello from React!')
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])

  useEffect(() => {
    const addLog = (event: string, data: any) => {
      const timestamp = new Date().toLocaleTimeString()
      setEventLog((prev) => {
        const newLog = [
          {
            timestamp,
            event,
            data: typeof data === 'object' ? JSON.stringify(data) : String(data),
          },
          ...prev,
        ]
        // 限制日志数量
        return newLog.slice(0, 20)
      })
    }

    // 监听自定义事件
    const customUnsub = engine.events.on('custom:event', (data: any) => {
      addLog('custom:event', data)
    })

    // 监听欢迎事件
    const welcomeUnsub = engine.events.on('app:welcome', (data: any) => {
      addLog('app:welcome', data)
    })

    // 监听用户事件
    const loginUnsub = engine.events.on('user:login', (data: any) => {
      addLog('user:login', data)
    })

    const logoutUnsub = engine.events.on('user:logout', (data: any) => {
      addLog('user:logout', data)
    })

    // 清理事件监听器
    return () => {
      customUnsub()
      welcomeUnsub()
      loginUnsub()
      logoutUnsub()
    }
  }, [engine])

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
    <div className="demo-card">
      <h2>📡 事件系统演示</h2>
      <div className="demo-content">
        <div className="event-controls">
          <div className="input-group">
            <label>事件名称:</label>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              type="text"
              placeholder="输入事件名称"
              className="input"
            />
          </div>
          <div className="input-group">
            <label>事件数据:</label>
            <input
              value={eventData}
              onChange={(e) => setEventData(e.target.value)}
              type="text"
              placeholder="输入事件数据"
              className="input"
            />
          </div>
        </div>

        <div className="actions">
          <button onClick={emitEvent} className="btn btn-primary">
            触发事件
          </button>
          <button onClick={emitAsyncEvent} className="btn btn-secondary">
            触发异步事件
          </button>
          <button onClick={clearLog} className="btn btn-secondary">
            清空日志
          </button>
        </div>

        {eventLog.length > 0 && (
          <div className="log">
            <strong>事件日志:</strong>
            <div className="log-entries">
              {eventLog.map((entry, index) => (
                <div key={index} className="log-entry">
                  <span className="timestamp">{entry.timestamp}</span>
                  <span className="event-name">{entry.event}</span>
                  <span className="event-data">{entry.data}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info">
          <p>💡 提示: 所有事件都会被 logger 插件记录到控制台</p>
        </div>
      </div>
    </div>
  )
}

export default EventDemo

