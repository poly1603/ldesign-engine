import { component$ } from '@builder.io/qwik'
import { useAppConfig } from '@ldesign/launcher/client/qwik'

export default component$(() => {
  const { config, environment } = useAppConfig()
  const cfg: any = config.value
  const env: any = environment.value
  const dev: any = cfg?.dev || {}
  const primary = cfg?.theme?.primaryColor || '#18b6f6'
  return (
    <div style={{ border: `2px solid ${primary}`, borderRadius: '12px', padding: '12px', marginBottom: '16px', background: 'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0 }}>📋 应用配置信息</h3>
        <small style={{ opacity: .7 }}>env: {env.mode} · dev:{String(env.isDev)} · prod:{String(env.isProd)}</small>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px' }}>
        <section style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>应用信息</h4>
          <div>名称：<b>{cfg.app?.name || '-'}</b></div>
          <div>版本：<code>{cfg.app?.version || '-'}</code></div>
          <div>描述：{cfg.app?.description || '-'}</div>
        </section>
        <section style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>API 配置</h4>
          <div>API 地址：<code>{cfg.api?.baseUrl || '-'}</code></div>
          <div>超时时间：{cfg.api?.timeout || '-'} ms</div>
        </section>
        <section style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>功能特性</h4>
          <div>分析统计：{cfg.features?.enableAnalytics ? '✅ 开启' : '❌ 关闭'}</div>
          <div>调试模式：{cfg.features?.enableDebug ? '✅ 开启' : '❌ 关闭'}</div>
        </section>
        <section style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>主题配置</h4>
          <div>主色调：<span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '7px', verticalAlign: '-2px', marginRight: '6px', background: primary }} /> {primary}</div>
          <div>模式：{cfg.theme?.mode || 'light'}</div>
        </section>
        {dev && (
          <section style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 6px', color: primary }}>开发配置</h4>
            <div>显示配置面板：{dev.showConfigPanel !== false ? '✅ 开启' : '❌ 关闭'}</div>
            <div>日志级别：{dev.logLevel || 'info'}</div>
            <div>热更新：{dev.enableHotReload ? '✅ 开启' : '❌ 关闭'}</div>
          </section>
        )}
        <section style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 6px', color: primary }}>环境信息</h4>
          <div>运行模式：{env.mode || 'development'}</div>
          <div>开发环境：{env.isDev ? '✅ 是' : '❌ 否'}</div>
          <div>生产环境：{env.isProd ? '✅ 是' : '❌ 否'}</div>
        </section>
      </div>
    </div>
  )
})

