<script lang="ts">
  import { getEngineContext } from '@ldesign/engine-svelte'
  import './DemoCard.css'

  const engine = getEngineContext()

  let count = $state(0)
  let user = $state({ name: '', role: '' })
  let theme = $state('light')
  let stateKeys = $state<string[]>([])

  // 监听状态变化
  $effect(() => {
    const countUnsub = engine.state.watch('count', (value: number) => {
      count = value
    })

    const userUnsub = engine.state.watch('user', (value: any) => {
      user = value
    })

    const themeUnsub = engine.state.watch('theme', (value: string) => {
      theme = value
    })

    // 初始化状态
    count = engine.state.get('count') || 0
    user = engine.state.get('user') || { name: '', role: '' }
    theme = engine.state.get('theme') || 'light'
    updateStateKeys()

    // 清理
    return () => {
      countUnsub()
      userUnsub()
      themeUnsub()
    }
  })

  function increment() {
    engine.state.set('count', count + 1)
  }

  function decrement() {
    engine.state.set('count', count - 1)
  }

  function handleSetTheme(newTheme: string) {
    engine.state.set('theme', newTheme)
  }

  function batchUpdate() {
    engine.state.batch(() => {
      engine.state.set('count', 100)
      engine.state.set('user', { name: '批量更新用户', role: 'superadmin' })
      engine.state.set('theme', 'dark')
    })
    updateStateKeys()
    alert('批量更新完成!')
  }

  function resetAll() {
    engine.state.set('count', 0)
    engine.state.set('user', { name: 'Svelte 用户', role: 'admin' })
    engine.state.set('theme', 'light')
    updateStateKeys()
    alert('状态已重置!')
  }

  function updateStateKeys() {
    stateKeys = engine.state.keys()
  }

  function getStateValue(key: string) {
    const value = engine.state.get(key)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
</script>

<div class="demo-card">
  <h2>📦 状态管理演示</h2>
  <div class="demo-content">
    <div class="state-display">
      <div class="state-item">
        <strong>计数器:</strong>
        <div class="counter">
          <button onclick={decrement} class="btn btn-small">-</button>
          <span class="count">{count}</span>
          <button onclick={increment} class="btn btn-small">+</button>
        </div>
      </div>

      <div class="state-item">
        <strong>用户信息:</strong>
        <div class="user-info">
          <p><strong>姓名:</strong> {user.name}</p>
          <p><strong>角色:</strong> {user.role}</p>
        </div>
      </div>

      <div class="state-item">
        <strong>主题:</strong>
        <div class="theme-switcher">
          <button
            onclick={() => handleSetTheme('light')}
            class="btn btn-small {theme === 'light' ? 'active' : ''}"
          >
            ☀️ 浅色
          </button>
          <button
            onclick={() => handleSetTheme('dark')}
            class="btn btn-small {theme === 'dark' ? 'active' : ''}"
          >
            🌙 深色
          </button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button onclick={batchUpdate} class="btn btn-primary">
        批量更新状态
      </button>
      <button onclick={resetAll} class="btn btn-secondary">
        重置所有状态
      </button>
    </div>

    <div class="state-list">
      <strong>所有状态:</strong>
      <div class="state-entries">
        {#each stateKeys as key (key)}
          <div class="state-entry">
            <code>{key}</code>: {getStateValue(key)}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
