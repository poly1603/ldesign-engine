import { LitElement, html, css, unsafeCSS } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { useEngine } from '@ldesign/engine-lit'
import type { CoreEngine } from '@ldesign/engine-core'
import demoCardStyles from './demo-card.css?inline'

@customElement('plugin-demo')
export class PluginDemo extends LitElement {
  static styles = [unsafeCSS(demoCardStyles)]

  @state()
  private plugins!: any[]

  @state()
  private pluginCount!: number

  private engine: CoreEngine = useEngine()

  constructor() {
    super()
    this.plugins = []
    this.pluginCount = 0
  }

  connectedCallback() {
    super.connectedCallback()
    this.updatePluginInfo()
  }

  updatePluginInfo() {
    this.pluginCount = this.engine.plugins.size()
    this.plugins = Array.from(this.engine.plugins.getAll().values())
    this.requestUpdate()
  }

  async installPlugin() {
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
      await this.engine.use(newPlugin)
      this.updatePluginInfo()
      alert(`插件 ${newPlugin.name} 安装成功!`)
    } catch (error: any) {
      alert(`插件安装失败: ${error.message}`)
    }
  }

  async uninstallPlugin() {
    if (this.plugins.length === 0) {
      alert('没有可卸载的插件')
      return
    }

    const lastPlugin = this.plugins[this.plugins.length - 1]
    try {
      await this.engine.plugins.uninstall(lastPlugin.name)
      this.updatePluginInfo()
      alert(`插件 ${lastPlugin.name} 卸载成功!`)
    } catch (error: any) {
      alert(`插件卸载失败: ${error.message}`)
    }
  }

  render() {
    return html`
      <div class="demo-card">
        <h2>🔌 插件系统演示</h2>
        <div class="demo-content">
          <div class="info-grid">
            <div class="info-item">
              <strong>已安装插件:</strong>
              ${this.plugins.length > 0
                ? html`
                    <ul>
                      ${this.plugins.map(
                        (plugin) => html`
                          <li>${plugin.name} v${plugin.version}</li>
                        `
                      )}
                    </ul>
                  `
                : html`<p class="empty">暂无插件</p>`}
            </div>
            <div class="info-item">
              <strong>插件数量:</strong>
              <span class="badge">${this.pluginCount}</span>
            </div>
          </div>

          <div class="actions">
            <button @click=${this.installPlugin} class="btn btn-primary">
              安装新插件
            </button>
            <button @click=${this.uninstallPlugin} class="btn btn-secondary">
              卸载插件
            </button>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'plugin-demo': PluginDemo
  }
}

