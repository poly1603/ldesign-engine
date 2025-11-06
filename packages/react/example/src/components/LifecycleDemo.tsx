import React, { useState, useEffect } from 'react'
import { useEngine } from '@ldesign/engine-react'
import './DemoCard.css'

interface LifecycleHook {
  name: string
  triggered: boolean
  count: number
}

interface HookLogEntry {
  timestamp: string
  hook: string
}

function LifecycleDemo() {
  const engine = useEngine()
  const [engineInitialized, setEngineInitialized] = useState(false)
  const [triggerCount, setTriggerCount] = useState(0)
  const [lifecycleHooks, setLifecycleHooks] = useState<LifecycleHook[]>([
    { name: 'beforeInit', triggered: false, count: 0 },
    { name: 'init', triggered: false, count: 0 },
    { name: 'afterInit', triggered: false, count: 0 },
    { name: 'beforeMount', triggered: false, count: 0 },
    { name: 'mounted', triggered: false, count: 0 },
    { name: 'custom', triggered: false, count: 0 },
  ])
  const [hookLog, setHookLog] = useState<HookLogEntry[]>([])

  useEffect(() => {
    setEngineInitialized(engine.isInitialized())

    const onHookTriggered = (hookName: string) => {
      setLifecycleHooks((prev) =>
        prev.map((hook) =>
          hook.name === hookName
            ? { ...hook, triggered: true, count: hook.count + 1 }
            : hook
        )
      )
      setTriggerCount((prev) => prev + 1)

      const timestamp = new Date().toLocaleTimeString()
      setHookLog((prev) => {
        const newLog = [{ timestamp, hook: hookName }, ...prev]
        // 限制日志数量
        return newLog.slice(0, 15)
      })
    }

    // 注册生命周期钩子监听
    const unsubscribers = lifecycleHooks.map((hook) =>
      engine.lifecycle.on(hook.name, () => {
        onHookTriggered(hook.name)
      })
    )

    // 清理监听器
    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [engine])

  const triggerCustomHook = async () => {
    await engine.lifecycle.trigger('custom', { message: '自定义钩子触发' })
    alert('自定义钩子已触发!')
  }

  const resetCounts = () => {
    setLifecycleHooks((prev) =>
      prev.map((hook) => ({ ...hook, count: 0, triggered: false }))
    )
    setTriggerCount(0)
    setHookLog([])
  }

  return (
    <div className="demo-card">
      <h2>🔄 生命周期演示</h2>
      <div className="demo-content">
        <div className="lifecycle-status">
          <div className="status-item">
            <strong>引擎状态:</strong>
            <span
              className={`status-badge ${engineInitialized ? 'active' : 'inactive'}`}
            >
              {engineInitialized ? '已初始化' : '未初始化'}
            </span>
          </div>
          <div className="status-item">
            <strong>触发次数:</strong>
            <span className="badge">{triggerCount}</span>
          </div>
        </div>

        <div className="lifecycle-hooks">
          <strong>生命周期钩子:</strong>
          <div className="hooks-grid">
            {lifecycleHooks.map((hook) => (
              <div
                key={hook.name}
                className={`hook-item ${hook.triggered ? 'triggered' : ''}`}
              >
                <span className="hook-name">{hook.name}</span>
                <span className="hook-count">{hook.count}次</span>
              </div>
            ))}
          </div>
        </div>

        <div className="actions">
          <button onClick={triggerCustomHook} className="btn btn-primary">
            触发自定义钩子
          </button>
          <button onClick={resetCounts} className="btn btn-secondary">
            重置计数
          </button>
        </div>

        {hookLog.length > 0 && (
          <div className="log">
            <strong>钩子日志:</strong>
            <div className="log-entries">
              {hookLog.map((entry, index) => (
                <div key={index} className="log-entry">
                  <span className="timestamp">{entry.timestamp}</span>
                  <span className="hook-name">{entry.hook}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LifecycleDemo

