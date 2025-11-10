import React from 'react'
import { useEngine, useEngineState } from '@ldesign/engine-react'
import ConfigPanel from '../components/ConfigPanel'

function Home() {
  const engine = useEngine()
  const count = useEngineState('count', 0)

  const increment = () => {
    engine.state.set('count', count + 1)
  }

  const decrement = () => {
    engine.state.set('count', Math.max(0, count - 1))
  }

  return (
    <div className="page">
      <h2>🏠 首页</h2>
      <p>欢迎使用 React + LDesign Engine + Router 示例应用！</p>

      {/* 配置面板 */}
      <ConfigPanel />

      <div className="card">
        <h3>计数器演示</h3>
        <div className="counter">
          <button onClick={decrement}>-</button>
          <span className="count">{count}</span>
          <button onClick={increment}>+</button>
        </div>
        <p className="hint">这个计数器使用 Engine 的状态管理</p>
      </div>

      <div className="card">
        <h3>✨ 特性</h3>
        <ul>
          <li>🚀 React 18+ 支持</li>
          <li>🔧 强大的插件系统</li>
          <li>🎯 完整的 TypeScript 支持</li>
          <li>🛣️ 集成路由管理</li>
          <li>📦 状态管理</li>
          <li>🎪 事件系统</li>
        </ul>
      </div>

      <div className="card">
        <h3>🧭 导航</h3>
        <p>使用顶部导航栏访问不同页面：</p>
        <ul>
          <li><strong>首页</strong> - 当前页面</li>
          <li><strong>关于</strong> - 了解更多信息</li>
          <li><strong>用户</strong> - 查看用户详情（带参数）</li>
        </ul>
      </div>
    </div>
  )
}

export default Home

