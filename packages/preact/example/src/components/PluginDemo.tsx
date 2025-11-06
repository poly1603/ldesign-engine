import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'
import type { CoreEngine } from '@ldesign/engine-core'
import './demo-card.css'

export default function PluginDemo() {
  const engine: CoreEngine = useEngine()
  const [plugins, setPlugins] = useState<any[]>([])
  const [pluginCount, setPluginCount] = useState(0)

  useEffect(() => {
    updatePluginInfo()
  }, [])

  const updatePluginInfo = () => {
    setPluginCount(engine.plugins.size())
    setPlugins(Array.from(engine.plugins.getAll().values()))
  }

  const installPlugin = async () => {
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

  const uninstallPlugin = async () => {
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

  return (
    <div class="demo-card">
      <h2>🔌 插件系统演示</h2>
      <div class="demo-content">
        <div class="info-grid">
          <div class="info-item">
            <strong>已安装插件:</strong>
            {plugins.length > 0 ? (
              <ul>
                {plugins.map((plugin) => (
                  <li key={plugin.name}>
                    {plugin.name} v{plugin.version}
                  </li>
                ))}
              </ul>
            ) : (
              <p class="empty">暂无插件</p>
            )}
          </div>
          <div class="info-item">
            <strong>插件数量:</strong>
            <span class="badge">{pluginCount}</span>
          </div>
        </div>

        <div class="actions">
          <button onClick={installPlugin} class="btn btn-primary">
            安装新插件
          </button>
          <button onClick={uninstallPlugin} class="btn btn-secondary">
            卸载插件
          </button>
        </div>
      </div>
    </div>
  )
}



