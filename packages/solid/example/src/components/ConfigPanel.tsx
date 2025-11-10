import { Component } from 'solid-js'
import { useAppConfig } from '@ldesign/launcher/client/solid'

const ConfigPanel: Component = () => {
  const { config, environment } = useAppConfig()
  const cfg = config
  const primary = () => cfg().theme?.primaryColor || '#2c4f7c'
  return (
    <div style={{ border: `2px solid ${primary()}`, 'border-radius': '12px', padding: '12px', 'margin-bottom': '16px', background: 'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)' }}>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
        <h3 style={{ margin: 0 }}>📋 应用配置信息</h3>
        <small>env: {environment().mode} · dev:{String((environment() as any).isDev)} · prod:{String((environment() as any).isProd ?? (environment().mode === 'production'))}</small>
      </div>
      <div style={{ display: 'grid', 'grid-template-columns': 'repeat(auto-fit,minmax(240px,1fr))', gap: '10px' }}>
        <section style={{ background: '#fff', padding: '10px', 'border-radius': '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary() }}>应用信息</h4>
          <div>名称：<b>{cfg().app?.name}</b></div>
          <div>版本：<code>{cfg().app?.version}</code></div>
          <div>描述：{cfg().app?.description}</div>
        </section>
        <section style={{ background: '#fff', padding: '10px', 'border-radius': '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary() }}>API</h4>
          <div>baseUrl：<code>{cfg().api?.baseUrl}</code></div>
          <div>timeout：{cfg().api?.timeout} ms</div>
        </section>
        <section style={{ background: '#fff', padding: '10px', 'border-radius': '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary() }}>特性</h4>
          <div>分析：{cfg().features?.enableAnalytics ? '✅' : '❌'}</div>
          <div>调试：{cfg().features?.enableDebug ? '✅' : '❌'}</div>
        </section>
        <section style={{ background: '#fff', padding: '10px', 'border-radius': '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary() }}>主题</h4>
          <div>主色：<span style={{ display: 'inline-block', width: '14px', height: '14px', 'border-radius': '7px', 'vertical-align': '-2px', 'margin-right': '6px', background: cfg().theme?.primaryColor }} /> {cfg().theme?.primaryColor}</div>
          <div>模式：{cfg().theme?.mode}</div>
        </section>
        {cfg().dev && (
          <section style={{ background: '#fff', padding: '10px', 'border-radius': '8px' }}>
            <h4 style={{ margin: '0 0 6px', color: primary() }}>开发</h4>
            <div>显示面板：{cfg().dev.showConfigPanel !== false ? '✅' : '❌'}</div>
            <div>日志：{cfg().dev.logLevel || 'info'}</div>
            <div>HMR：{cfg().dev.enableHotReload ? '✅' : '❌'}</div>
          </section>
        )}

      </div>
    </div>
  )
}

export default ConfigPanel

