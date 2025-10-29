import React from 'react'
import Counter from './components/Counter'
import EventDemo from './components/EventDemo'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>@ldesign/engine-react</h1>
        <p>React adapter for @ldesign/engine-core</p>
      </header>

      <main className="main">
        <section className="section">
          <h2>计数器示例</h2>
          <p>展示 useEngineState 状态管理</p>
          <Counter />
        </section>

        <section className="section">
          <h2>事件系统示例</h2>
          <p>展示 useEventListener 和 useEventEmitter</p>
          <EventDemo />
        </section>
      </main>

      <footer className="footer">
        <p>Powered by @ldesign/engine</p>
      </footer>
    </div>
  )
}

export default App


