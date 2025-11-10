import { h } from 'preact'
import { useState } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'
import ConfigPanel from '../components/ConfigPanel'


export default function Home() {
  const engine = useEngine()
  const [count, setCount] = useState(0)

  const increment = () => {
    setCount(count + 1)
  }

  const decrement = () => {
    setCount(Math.max(0, count - 1))
  }

  return (
    <div class="page">
      <h2>🏠 首页</h2>
      <ConfigPanel />

      <p>欢迎使用 Preact + LDesign Engine + Router 示例应用！</p>

      <div class="card">
        <h3>计数器演示</h3>
        <div class="counter">
          <button onClick={decrement}>-</button>
          <span class="count">{count}</span>
          <button onClick={increment}>+</button>
        </div>
        <p class="hint">这个计数器使用 Engine 的状态管理</p>
      </div>

      <div class="card">
        <h3>✨ 特性</h3>
        <ul>
          <li>⚡ Preact 支持（轻量级 React 替代）</li>
          <li>🔧 强大的插件系统</li>
          <li>🎯 完整的 TypeScript 支持</li>
          <li>🛣️ 集成路由管理</li>
          <li>📦 状态管理</li>
          <li>🎪 事件系统</li>
        </ul>
      </div>

      <div class="card">
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

