import { Component, createSignal, createEffect, onMount } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'
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

const LifecycleDemo: Component = () => {
  const engine = useEngine()
  const [engineInitialized, setEngineInitialized] = createSignal(false)
  const [triggerCount, setTriggerCount] = createSignal(0)
  const [lifecycleHooks, setLifecycleHooks] = createSignal<LifecycleHook[]>([
    { name: 'beforeInit', triggered: false, count: 0 },
    { name: 'init', triggered: false, count: 0 },
    { name: 'afterInit', triggered: false, count: 0 },
    { name: 'beforeMount', triggered: false, count: 0 },
    { name: 'mounted', triggered: false, count: 0 },
    { name: 'custom', triggered: false, count: 0 },
  ])
  const [hookLog, setHookLog] = createSignal<HookLogEntry[]>([])

  onMount(() => {
    setEngineInitialized(engine.isInitialized())
  })

  createEffect(() => {
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
      setHookLog((prev) => [{ timestamp, hook: hookName }, ...prev].slice(0, 15))
    }

    const unsubscribers = lifecycleHooks().map((hook) =>
      engine.lifecycle.on(hook.name, () => {
        onHookTriggered(hook.name)
      })
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  })

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
    <div class="demo-card">
      <h2>🔄 生命周期演示</h2>
      <div class="demo-content">
        <div class="lifecycle-status">
          <div class="status-item">
            <strong>引擎状态:</strong>
            <span class={`status-badge ${engineInitialized() ? 'active' : 'inactive'}`}>
              {engineInitialized() ? '已初始化' : '未初始化'}
            </span>
          </div>
          <div class="status-item">
            <strong>触发次数:</strong>
            <span class="badge">{triggerCount()}</span>
          </div>
        </div>

        <div class="lifecycle-hooks">
          <strong>生命周期钩子:</strong>
          <div class="hooks-grid">
            {lifecycleHooks().map((hook) => (
              <div class={`hook-item ${hook.triggered ? 'triggered' : ''}`}>
                <span class="hook-name">{hook.name}</span>
                <span class="hook-count">{hook.count}次</span>
              </div>
            ))}
          </div>
        </div>

        <div class="actions">
          <button onClick={triggerCustomHook} class="btn btn-primary">
            触发自定义钩子
          </button>
          <button onClick={resetCounts} class="btn btn-secondary">
            重置计数
          </button>
        </div>

        {hookLog().length > 0 && (
          <div class="log">
            <strong>钩子日志:</strong>
            <div class="log-entries">
              {hookLog().map((entry) => (
                <div class="log-entry">
                  <span class="timestamp">{entry.timestamp}</span>
                  <span class="hook-name">{entry.hook}</span>
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

