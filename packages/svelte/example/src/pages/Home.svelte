<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { getEngine } from '@ldesign/engine-svelte'
  import ConfigPanel from '../components/ConfigPanel.svelte'

  const engine = getEngine()
  let count = 0
  let unsubscribe: (() => void) | undefined

  onMount(() => {
    count = engine.state.get('count') || 0
    unsubscribe = engine.state.watch('count', (value: number) => {
      count = value
    })
  })

  onDestroy(() => {
    if (unsubscribe) unsubscribe()
  })

  function increment() {
    engine.state.set('count', count + 1)
  }

  function decrement() {
    engine.state.set('count', Math.max(0, count - 1))
  }
</script>

<div class="page">
  <h2>🏠 首页</h2>
  <p>欢迎使用 Svelte + LDesign Engine + Router 示例应用！</p>

  <!-- 配置面板 -->
  <ConfigPanel />

  <div class="card">
    <h3>计数器演示</h3>
    <div class="counter">
      <button on:click={decrement}>-</button>
      <span class="count">{count}</span>
      <button on:click={increment}>+</button>
    </div>
    <p class="hint">这个计数器使用 Engine 的状态管理</p>
  </div>

  <div class="card">
    <h3>✨ 特性</h3>
    <ul>
      <li>⚡ Svelte 5 支持（最新版本）</li>
      <li>🔧 强大的插件系统</li>
      <li>🎯 完整的 TypeScript 支持</li>
      <li>🛣️ 集成路由管理</li>
      <li>📦 状态管理</li>
      <li>🎪 事件系统</li>
    </ul>
  </div>

  <div class="card">
    <h3>🧭 导航</h3>
    <p>使用顶部导航栏访问不同页面：</p>
    <ul>
      <li><strong>首页</strong> - 当前页面</li>
      <li><strong>关于</strong> - 了解更多信息</li>
      <li><strong>用户</strong> - 查看用户详情（带参数）</li>
    </ul>
  </div>
</div>

