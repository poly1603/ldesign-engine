import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { useEngine } from '@ldesign/engine-angular'
import './demo-card.css'

@Component({
  selector: 'app-plugin-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-card">
      <h2>🔌 插件系统演示</h2>
      <div class="demo-content">
        <div class="info-grid">
          <div class="info-item">
            <strong>已安装插件:</strong>
            <ul *ngIf="plugins.length > 0; else noPlugins">
              <li *ngFor="let plugin of plugins">{{ plugin.name }} v{{ plugin.version }}</li>
            </ul>
            <ng-template #noPlugins>
              <p class="empty">暂无插件</p>
            </ng-template>
          </div>
          <div class="info-item">
            <strong>插件数量:</strong>
            <span class="badge">{{ pluginCount }}</span>
          </div>
        </div>

        <div class="actions">
          <button (click)="installPlugin()" class="btn btn-primary">安装新插件</button>
          <button (click)="uninstallPlugin()" class="btn btn-secondary">卸载插件</button>
        </div>
      </div>
    </div>
  `,
})
export class PluginDemoComponent implements OnInit {
  plugins: any[] = []
  pluginCount = 0
  engine = useEngine()

  ngOnInit() {
    this.updatePluginInfo()
  }

  updatePluginInfo() {
    this.pluginCount = this.engine.plugins.size()
    this.plugins = Array.from(this.engine.plugins.getAll().values())
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
}

