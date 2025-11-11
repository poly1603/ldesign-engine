import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'

// 从 import.meta.env 读取配置的帮助函数（与 launcher 对齐结构）
function readConfig() {
  const envAny = (import.meta as any)?.env ?? {}
  const appConfig = envAny.appConfig ?? {}
  // launcher 注入的结构为 { app, api, features, theme, dev }
  const cfg = (appConfig as any) || {}
  return {
    env: {
      mode: envAny.MODE || 'development',
      isDev: envAny.DEV ?? true,
      isProd: envAny.PROD ?? false,
    },
    cfg,
  }
}

export default function ConfigPanel() {
  const [state, setState] = useState(readConfig())

  // 订阅 HMR 自定义事件，实时更新配置
  useEffect(() => {
    const hot: any = (import.meta as any)?.hot
    if (hot) {
      const handler = (newConfig: any) => {
        setState({ env: state.env, cfg: newConfig as any })
      }
      hot.on?.('app-config-updated', handler)
      return () => hot.off?.('app-config-updated', handler)
    }
  }, [])

  const { env, cfg } = state
  const dev = cfg.dev || {}
  const primary = cfg.theme?.primaryColor || '#673ab8'

  return (
    <div style={{ border: `2px solid ${primary}`, borderRadius: 12, padding: '12px', marginBottom: '16px', background: 'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>📋 应用配置信息</h3>
        <small style={{ opacity: .7 }}>env: {env.mode} · dev:{String(env.isDev)} · prod:{String(env.isProd)}</small>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
        <section style={{ background: '#fff', padding: 10, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>应用信息</h4>
          <div>名称：<b>{cfg.app?.name}</b></div>
          <div>版本：<code>{cfg.app?.version}</code></div>
          <div>描述：{cfg.app?.description}</div>
        </section>
        <section style={{ background: '#fff', padding: 10, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>API</h4>
          <div>baseUrl：<code>{cfg.api?.baseUrl}</code></div>
          <div>timeout：{cfg.api?.timeout} ms</div>
        </section>
        <section style={{ background: '#fff', padding: 10, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>特性</h4>
          <div>分析：{cfg.features?.enableAnalytics ? '✅' : '❌'}</div>
          <div>调试：{cfg.features?.enableDebug ? '✅' : '❌'}</div>
        </section>
        <section style={{ background: '#fff', padding: 10, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>主题</h4>
          <div>主色：<span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 7, verticalAlign: '-2px', marginRight: 6, background: cfg.theme?.primaryColor }} /> {cfg.theme?.primaryColor}</div>
          <div>模式：{cfg.theme?.mode}</div>
        </section>
        {dev && (
          <section style={{ background: '#fff', padding: 10, borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 6px', color: primary }}>开发</h4>
            <div>显示面板：{dev.showConfigPanel !== false ? '✅' : '❌'}</div>
            <div>日志：{dev.logLevel || 'info'}</div>
            <div>HMR：{dev.enableHotReload ? '✅' : '❌'}</div>
          </section>
        )}
      </div>
    </div>
  )
}

