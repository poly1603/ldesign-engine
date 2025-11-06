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

  .header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--size-spacing-md);
  }

  .header h1 {
    margin: 0;
    font-size: var(--size-font-4xl);
    font-weight: var(--size-font-weight-bold);
    line-height: var(--size-line-snug);
    background: linear-gradient(
      135deg,
      var(--demo-highlight-gradient-start) 0%,
      var(--demo-highlight-gradient-end) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .header p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--size-font-lg);
    line-height: var(--size-line-relaxed);
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: var(--demo-section-gap);
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(calc(var(--size-15) * 4), 1fr));
    gap: var(--demo-grid-gap);
    margin-top: var(--demo-section-gap);
  }

  .feature {
    padding: var(--demo-card-padding);
    border-radius: var(--demo-card-radius);
    background: linear-gradient(
      135deg,
      var(--demo-feature-gradient-start) 0%,
      var(--demo-feature-gradient-end) 100%
    );
    border: 1px solid color-mix(in srgb, var(--color-primary-default) 25%, transparent);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(6px);
  }

  .feature h3 {
    margin: 0 0 var(--size-spacing-sm);
    color: var(--color-text-primary);
    font-size: var(--size-font-xl);
    font-weight: var(--size-font-weight-semibold);
  }

  .feature p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: var(--size-line-relaxed);
    font-size: var(--size-font-md);
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

