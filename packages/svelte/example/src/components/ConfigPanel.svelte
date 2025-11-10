<script lang="ts">
  import { appConfig, appEnvironment } from '@ldesign/launcher/client/svelte'

  let collapsed = $state(false)

  // 响应式计算属性 - 使用 Svelte 5 的 $derived
  const hasConfig = $derived(true)
  const isValidConfig = $derived($appConfig && typeof $appConfig === 'object' && Object.keys($appConfig).length > 0)
  const showPanel = $derived(!isValidConfig || $appConfig.dev?.showConfigPanel !== false)
  const primaryColor = $derived($appConfig?.theme?.primaryColor || '#ff3e00')
</script>

{#if showPanel && hasConfig}
  <div class="config-panel" style="border-color: {primaryColor}">
    <div class="config-panel-header">
      <h3>📋 应用配置信息</h3>
      <button class="toggle-btn" onclick={() => collapsed = !collapsed}>
        {collapsed ? '展开' : '收起'}
      </button>
    </div>
    
    {#if !collapsed}
      <div class="config-panel-content">
        <!-- 配置无效时显示错误信息 -->
        {#if !isValidConfig}
          <div class="config-error">
            <h4>❌ 配置加载失败</h4>
            <pre style="font-size: 0.75rem; margin-top: 0.5rem; color: #999; white-space: pre-wrap;">配置对象: {JSON.stringify($appConfig, null, 2)}</pre>
            <pre style="font-size: 0.75rem; margin-top: 0.5rem; color: #999; white-space: pre-wrap;">环境信息: {JSON.stringify($appEnvironment, null, 2)}</pre>
          </div>
        {:else}
          <div class="config-grid">
            <!-- 应用信息 -->
            <section class="config-section">
              <h4 style="color: {primaryColor}">应用信息</h4>
              <div>名称：<b>{$appConfig.app?.name || '-'}</b></div>
              <div>版本：<code>{$appConfig.app?.version || '-'}</code></div>
              <div>描述：{$appConfig.app?.description || '-'}</div>
            </section>

            <!-- API 配置 -->
            <section class="config-section">
              <h4 style="color: {primaryColor}">API 配置</h4>
              <div>API 地址：<code>{$appConfig.api?.baseUrl || '-'}</code></div>
              <div>超时时间：{$appConfig.api?.timeout || '-'} ms</div>
            </section>

            <!-- 功能特性 -->
            <section class="config-section">
              <h4 style="color: {primaryColor}">功能特性</h4>
              <div>分析统计：{$appConfig.features?.enableAnalytics ? '✅ 开启' : '❌ 关闭'}</div>
              <div>调试模式：{$appConfig.features?.enableDebug ? '✅ 开启' : '❌ 关闭'}</div>
            </section>

            <!-- 主题配置 -->
            <section class="config-section">
              <h4 style="color: {primaryColor}">主题配置</h4>
              <div>
                主色调：
                <span class="color-dot" style="background: {primaryColor}"></span>
                {primaryColor}
              </div>
              <div>模式：{$appConfig.theme?.mode || 'light'}</div>
            </section>

            <!-- 开发配置 -->
            {#if $appConfig.dev}
              <section class="config-section">
                <h4 style="color: {primaryColor}">开发配置</h4>
                <div>显示配置面板：{$appConfig.dev.showConfigPanel !== false ? '✅ 开启' : '❌ 关闭'}</div>
                <div>日志级别：{$appConfig.dev.logLevel || 'info'}</div>
                <div>热更新：{$appConfig.dev.enableHotReload ? '✅ 开启' : '❌ 关闭'}</div>
              </section>
            {/if}

            <!-- 环境信息 -->
            <section class="config-section">
              <h4 style="color: {primaryColor}">环境信息</h4>
              <div>运行模式：{$appEnvironment.mode || 'development'}</div>
              <div>开发环境：{$appEnvironment.isDev ? '✅ 是' : '❌ 否'}</div>
              <div>生产环境：{$appEnvironment.isProd ? '✅ 是' : '❌ 否'}</div>
            </section>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .config-panel {
    border: 2px solid #ff3e00;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .config-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .config-panel-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .toggle-btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: #f0f0f0;
    border-color: #bbb;
  }

  .config-panel-content {
    margin-top: 1rem;
  }

  .config-error {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 1rem;
    color: #856404;
  }

  .config-error h4 {
    margin: 0 0 0.5rem;
    color: #d32f2f;
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  .config-section {
    background: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .config-section h4 {
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 600;
  }

  .config-section div {
    margin: 4px 0;
    font-size: 0.875rem;
    color: #555;
  }

  .config-section code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    color: #d63384;
  }

  .config-section b {
    color: #333;
  }

  .color-dot {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    vertical-align: -2px;
    margin-right: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>

