<script lang="ts">
  import { getEngineContext } from '@ldesign/engine-svelte'
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

  const engine = getEngineContext()

  let engineInitialized = $state(false)
  let triggerCount = $state(0)
  let lifecycleHooks = $state<LifecycleHook[]>([
    { name: 'beforeInit', triggered: false, count: 0 },
    { name: 'init', triggered: false, count: 0 },
    { name: 'afterInit', triggered: false, count: 0 },
    { name: 'beforeMount', triggered: false, count: 0 },
    { name: 'mounted', triggered: false, count: 0 },
    { name: 'custom', triggered: false, count: 0 },
  ])
  let hookLog = $state<HookLogEntry[]>([])

  // 监听生命周期钩子
  $effect(() => {
    engineInitialized = engine.isInitialized()

    const onHookTriggered = (hookName: string) => {
      lifecycleHooks = lifecycleHooks.map((hook) =>
        hook.name === hookName
          ? { ...hook, triggered: true, count: hook.count + 1 }
          : hook
      )
      triggerCount++

      const timestamp = new Date().toLocaleTimeString()
      hookLog = [{ timestamp, hook: hookName }, ...hookLog].slice(0, 15)
    }

    // 注册生命周期钩子监听
    const unsubscribers = lifecycleHooks.map((hook) =>
      engine.lifecycle.on(hook.name, () => {
        onHookTriggered(hook.name)
      })
    )

    // 清理
    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  })

  async function triggerCustomHook() {
    await engine.lifecycle.trigger('custom', { message: '自定义钩子触发' })
    alert('自定义钩子已触发!')
  }

  function resetCounts() {
    lifecycleHooks = lifecycleHooks.map((hook) => ({
      ...hook,
      count: 0,
      triggered: false,
    }))
    triggerCount = 0
    hookLog = []
  }
</script>

<div class="demo-card">
  <h2>🔄 生命周期演示</h2>
  <div class="demo-content">
    <div class="lifecycle-status">
      <div class="status-item">
        <strong>引擎状态:</strong>
        <span class="status-badge {engineInitialized ? 'active' : 'inactive'}">
          {engineInitialized ? '已初始化' : '未初始化'}
        </span>
      </div>
      <div class="status-item">
        <strong>触发次数:</strong>
        <span class="badge">{triggerCount}</span>
      </div>
    </div>

    <div class="lifecycle-hooks">
      <strong>生命周期钩子:</strong>
      <div class="hooks-grid">
        {#each lifecycleHooks as hook (hook.name)}
          <div class="hook-item {hook.triggered ? 'triggered' : ''}">
            <span class="hook-name">{hook.name}</span>
            <span class="hook-count">{hook.count}次</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="actions">
      <button onclick={triggerCustomHook} class="btn btn-primary">
        触发自定义钩子
      </button>
      <button onclick={resetCounts} class="btn btn-secondary">
        重置计数
      </button>
    </div>

    {#if hookLog.length > 0}
      <div class="log">
        <strong>钩子日志:</strong>
        <div class="log-entries">
          {#each hookLog as entry (entry.timestamp + entry.hook)}
            <div class="log-entry">
              <span class="timestamp">{entry.timestamp}</span>
              <span class="hook-name">{entry.hook}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
