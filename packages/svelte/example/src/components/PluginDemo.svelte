<script lang="ts">
  import { getEngineContext } from '@ldesign/engine-svelte'
  import './DemoCard.css'

  const engine = getEngineContext()

  let plugins = $state<any[]>([])
  let pluginCount = $state(0)

  function updatePluginInfo() {
    pluginCount = engine.plugins.size()
    plugins = Array.from(engine.plugins.getAll().values())
  }

  // 初始化
  $effect(() => {
    updatePluginInfo()
  })

  async function installPlugin() {
    const newPlugin = {
      name: `plugin-${Date.now()}`,
      version: '1.0.0',
      install(context: any) {
        console.log(`✅ 插件 ${newPlugin.name} 已安装`)
        context.engine.state.set(`plugin-${newPlugin.name}`, {
          installed: true,
          timestamp: Date.now(),
        })
      },
    }

    try {
      await engine.use(newPlugin)
      updatePluginInfo()
      alert(`插件 ${newPlugin.name} 安装成功!`)
    } catch (error: any) {
      alert(`插件安装失败: ${error.message}`)
    }
  }

  async function uninstallPlugin() {
    if (plugins.length === 0) {
      alert('没有可卸载的插件')
      return
    }

    const lastPlugin = plugins[plugins.length - 1]
    try {
      await engine.plugins.uninstall(lastPlugin.name)
      updatePluginInfo()
      alert(`插件 ${lastPlugin.name} 卸载成功!`)
    } catch (error: any) {
      alert(`插件卸载失败: ${error.message}`)
    }
  }
</script>

<div class="demo-card">
  <h2>🔌 插件系统演示</h2>
  <div class="demo-content">
    <div class="info-grid">
      <div class="info-item">
        <strong>已安装插件:</strong>
        {#if plugins.length > 0}
          <ul>
            {#each plugins as plugin (plugin.name)}
              <li>{plugin.name} v{plugin.version}</li>
            {/each}
          </ul>
        {:else}
          <p class="empty">暂无插件</p>
        {/if}
      </div>
      <div class="info-item">
        <strong>插件数量:</strong>
        <span class="badge">{pluginCount}</span>
      </div>
    </div>

    <div class="actions">
      <button onclick={installPlugin} class="btn btn-primary">
        安装新插件
      </button>
      <button onclick={uninstallPlugin} class="btn btn-secondary">
        卸载插件
      </button>
    </div>
  </div>
</div>
