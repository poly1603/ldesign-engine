import { h } from 'preact'
import { useAppConfig } from '@ldesign/launcher/client/react'

export default function ConfigPanel() {
  const { config, environment } = useAppConfig() as any
  const cfg = (config as any) || {}
  const dev = cfg.dev || {}
  const primary = cfg.theme?.primaryColor || '#673ab8'
  return (
    <div style={{border:`2px solid ${primary}`, borderRadius:12, padding:'12px', marginBottom:'16px', background:'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <h3 style={{margin:0}}>📋 应用配置信息</h3>
        <small style={{opacity:.7}}>env: {environment.mode} · dev:{String(environment.isDev)} · prod:{String(environment.isProd)}</small>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
        <section style={{background:'#fff',padding:10,borderRadius:8}}>
          <h4 style={{margin:'0 0 6px',color:primary}}>应用信息</h4>
          <div>名称：<b>{cfg.app?.name}</b></div>
          <div>版本：<code>{cfg.app?.version}</code></div>
          <div>描述：{cfg.app?.description}</div>
        </section>
        <section style={{background:'#fff',padding:10,borderRadius:8}}>
          <h4 style={{margin:'0 0 6px',color:primary}}>API</h4>
          <div>baseUrl：<code>{cfg.api?.baseUrl}</code></div>
          <div>timeout：{cfg.api?.timeout} ms</div>
        </section>
        <section style={{background:'#fff',padding:10,borderRadius:8}}>
          <h4 style={{margin:'0 0 6px',color:primary}}>特性</h4>
          <div>分析：{cfg.features?.enableAnalytics ? '✅' : '❌'}</div>
          <div>调试：{cfg.features?.enableDebug ? '✅' : '❌'}</div>
        </section>
        <section style={{background:'#fff',padding:10,borderRadius:8}}>
          <h4 style={{margin:'0 0 6px',color:primary}}>主题</h4>
          <div>主色：<span style={{display:'inline-block',width:14,height:14,borderRadius:7,verticalAlign:'-2px',marginRight:6,background:cfg.theme?.primaryColor}}/> {cfg.theme?.primaryColor}</div>
          <div>模式：{cfg.theme?.mode}</div>
        </section>
        {dev && (
          <section style={{background:'#fff',padding:10,borderRadius:8}}>
            <h4 style={{margin:'0 0 6px',color:primary}}>开发</h4>
            <div>显示面板：{dev.showConfigPanel !== false ? '✅' : '❌'}</div>
            <div>日志：{dev.logLevel || 'info'}</div>
            <div>HMR：{dev.enableHotReload ? '✅' : '❌'}</div>
          </section>
        )}
      </div>
    </div>
  )
}

