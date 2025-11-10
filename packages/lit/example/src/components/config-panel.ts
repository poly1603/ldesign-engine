import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { AppConfigController } from '@ldesign/launcher/client/lit'

@customElement('config-panel')
export class ConfigPanel extends LitElement {
  static styles = css`
    .panel{border:2px solid #324fff;border-radius:12px;padding:12px;margin:0 0 16px;background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
    section{background:#fff;padding:10px;border-radius:8px}
    h3{margin:0 0 8px}
    h4{margin:0 0 6px;color:#324fff}
  `

  private appConfigController = new AppConfigController(this)

  get cfg() {
    return this.appConfigController.config
  }

  get env() {
    return this.appConfigController.environment
  }

  render() {
    const theme = this.cfg?.theme || {}
    const dev = this.cfg?.dev || {}
    const primary = theme.primaryColor || '#324fff'
    return html`
      <div class="panel" style="border-color:${primary}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>📋 应用配置信息</h3>
          <small style="opacity:.7">env: ${this.env.mode || 'development'} · dev:${String(this.env.isDev)}</small>
        </div>
        <div class="grid">
          <section>
            <h4 style="color:${primary}">应用信息</h4>
            <div>名称：<b>${this.cfg?.app?.name || '-'}</b></div>
            <div>版本：<code>${this.cfg?.app?.version || '-'}</code></div>
            <div>描述：${this.cfg?.app?.description || '-'}</div>
          </section>
          <section>
            <h4 style="color:${primary}">API 配置</h4>
            <div>API 地址：<code>${this.cfg?.api?.baseUrl || '-'}</code></div>
            <div>超时时间：${this.cfg?.api?.timeout || '-'} ms</div>
          </section>
          <section>
            <h4 style="color:${primary}">功能特性</h4>
            <div>分析统计：${this.cfg?.features?.enableAnalytics ? '✅ 开启' : '❌ 关闭'}</div>
            <div>调试模式：${this.cfg?.features?.enableDebug ? '✅ 开启' : '❌ 关闭'}</div>
          </section>
          <section>
            <h4 style="color:${primary}">主题配置</h4>
            <div>主色调：
              <span style="display:inline-block;width:14px;height:14px;border-radius:7px;vertical-align:-2px;margin-right:6px;background:${primary}"></span>
              ${primary}
            </div>
            <div>模式：${theme.mode || 'light'}</div>
          </section>
          ${dev ? html`
            <section>
              <h4 style="color:${primary}">开发配置</h4>
              <div>显示配置面板：${dev.showConfigPanel !== false ? '✅ 开启' : '❌ 关闭'}</div>
              <div>日志级别：${dev.logLevel || 'info'}</div>
              <div>热更新：${dev.enableHotReload ? '✅ 开启' : '❌ 关闭'}</div>
            </section>
          ` : ''}
          <section>
            <h4 style="color:${primary}">环境信息</h4>
            <div>运行模式：${this.env.mode || 'development'}</div>
            <div>开发环境：${this.env.isDev ? '✅ 是' : '❌ 否'}</div>
            <div>生产环境：${this.env.isProd ? '✅ 是' : '❌ 否'}</div>
          </section>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap { 'config-panel': ConfigPanel }
}

