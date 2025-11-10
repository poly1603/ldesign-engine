import { Component, inject } from '@angular/core'
import { AppConfigService } from '@ldesign/launcher/client/angular'

// 这些常量来自 launcher.config.* 中的 define 注入
declare const __ENV__: string
declare const __DEV__: boolean
declare const __API_URL__: string

@Component({
  selector: 'app-config-panel',
  standalone: true,
  template: `
    <div class="panel">
      <div class="head">
        <h3>📋 应用配置信息</h3>
        <small>env: {{ environment().mode }} · dev: {{ environment().isDev }} · prod: {{ environment().isProd }}</small>
      </div>
      <div class="grid">
        <section>
          <h4>应用信息</h4>
          <div>名称：<b>{{ config().app?.name }}</b></div>
          <div>版本：<code>{{ config().app?.version }}</code></div>
          <div>描述：{{ config().app?.description }}</div>
        </section>
        <section>
          <h4>API</h4>
          <div>baseUrl：<code>{{ config().api?.baseUrl || apiUrl }}</code></div>
          <div>timeout：{{ config().api?.timeout }} ms</div>
        </section>
        <section>
          <h4>特性</h4>
          <div>分析：{{ config().features?.enableAnalytics ? '✅' : '❌' }}</div>
          <div>调试：{{ config().features?.enableDebug ? '✅' : '❌' }}</div>
        </section>
        <section>
          <h4>主题</h4>
          <div>
            主色：
            <span class="dot" [style.background]="config().theme?.primaryColor"></span>
            {{ config().theme?.primaryColor }}
          </div>
          <div>模式：{{ config().theme?.mode }}</div>
        </section>
        @if (config().dev) {
          <section>
            <h4>开发配置</h4>
            <div>显示配置面板：{{ config().dev.showConfigPanel !== false ? '✅' : '❌' }}</div>
            <div>日志级别：{{ config().dev.logLevel || 'info' }}</div>
            <div>热更新：{{ config().dev.enableHotReload ? '✅' : '❌' }}</div>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .panel{border:2px solid #dd0031;border-radius:12px;padding:12px;margin:0 0 16px;background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)}
    .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
    section{background:#fff;padding:10px;border-radius:8px}
    h4{margin:0 0 6px;color:#dd0031}
    .dot{display:inline-block;width:14px;height:14px;border-radius:7px;vertical-align:-2px;margin-right:6px}
  `]
})
export class ConfigPanelComponent {
  // 注入 AppConfigService
  private appConfigService = inject(AppConfigService)

  // 使用 Signal 获取配置（支持 HMR 热更新）
  config = this.appConfigService.config
  environment = this.appConfigService.environment

  // 从 define 注入的常量（用于对比）
  apiUrl = typeof __API_URL__ !== 'undefined' ? __API_URL__ : ''
}

