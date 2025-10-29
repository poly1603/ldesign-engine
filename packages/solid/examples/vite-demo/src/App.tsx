import { Component } from 'solid-js'
import Counter from './components/Counter'
import EventDemo from './components/EventDemo'
import './App.css'

const App: Component = () => {
  return (
    <div class="app">
      <header class="header">
        <h1>@ldesign/engine-solid</h1>
        <p>Solid.js adapter for @ldesign/engine-core</p>
      </header>

      <main class="main">
        <section class="section">
          <h2>计数器示例</h2>
          <p>展示 useEngineState 状态管理</p>
          <Counter />
        </section>

        <section class="section">
          <h2>事件系统示例</h2>
          <p>展示 useEventListener 和 useEventEmitter</p>
          <EventDemo />
        </section>
      </main>

      <footer class="footer">
        <p>Powered by @ldesign/engine</p>
      </footer>
    </div>
  )
}

export default App


