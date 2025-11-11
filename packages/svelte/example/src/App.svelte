<script lang="ts">
  import { setEngineContext } from '@ldesign/engine-svelte'
  import Navigation from './components/Navigation.svelte'
  import RouterView from './components/RouterView.svelte'

  // 从 props 获取引擎实例 (Svelte 5 runes 语法)
  const { engine }: { engine: any } = $props()

  // 设置引擎到上下文,供子组件使用
  setEngineContext(engine)
</script>

<div class="app">
  <Navigation />
  <main class="main">
    <RouterView />
  </main>
  <footer class="footer">
    <p>Powered by @ldesign/engine-svelte + @ldesign/router</p>
  </footer>
</div>

<style>
  .app {
    max-width: var(--demo-app-max-width);
    margin: 0 auto;
    padding: var(--demo-app-padding-y) var(--demo-app-padding-x);
    display: flex;
    flex-direction: column;
    gap: var(--demo-section-gap);
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: var(--demo-section-gap);
  }

  .footer {
    text-align: center;
    margin-top: var(--demo-section-gap);
    padding-top: var(--size-spacing-2xl);
    border-top: 1px solid var(--color-border-light);
    color: var(--color-text-tertiary);
    font-size: var(--size-font-sm);
  }
</style>

