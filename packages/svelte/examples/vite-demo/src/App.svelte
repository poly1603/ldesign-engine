<script lang="ts">
  import Counter from './components/Counter.svelte'
  import EventDemo from './components/EventDemo.svelte'
  import { setContext } from 'svelte'
  import { ENGINE_CONTEXT_KEY } from '@ldesign/engine-svelte'

  // 从 props 接收 engine
  export let engine: any

  // 设置引擎上下文
  setContext(ENGINE_CONTEXT_KEY, engine)
</script>

<div class="app">
  <header class="header">
    <h1>@ldesign/engine-svelte</h1>
    <p>Svelte adapter for @ldesign/engine-core</p>
  </header>

  <main class="main">
    <section class="section">
      <h2>计数器示例</h2>
      <p>展示 createEngineStore 状态管理</p>
      <Counter />
    </section>

    <section class="section">
      <h2>事件系统示例</h2>
      <p>展示 useEventListener 和 useEventEmitter</p>
      <EventDemo />
    </section>
  </main>

  <footer class="footer">
    <p>Powered by @ldesign/engine</p>
  </footer>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid #e0e0e0;
  }

  .header h1 {
    font-size: 2.5rem;
    color: #ff3e00;
    margin-bottom: 0.5rem;
  }

  .header p {
    font-size: 1.2rem;
    color: #666;
  }

  .main {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .section {
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .section h2 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .section p {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .footer {
    text-align: center;
    padding-top: 2rem;
    border-top: 2px solid #e0e0e0;
    color: #999;
  }

  :global(button) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    background-color: #ff3e00;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  :global(button:hover) {
    background-color: #cc3100;
  }

  :global(button:active) {
    transform: translateY(1px);
  }
</style>


