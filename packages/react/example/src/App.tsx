import React from 'react'
import Navigation from './components/Navigation'
import RouterView from './components/RouterView'
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'
import './App.css'

function App() {
  // 定义路由配置（与 main.tsx 中的配置保持一致）
  const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/user/:id', component: User },
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 React + LDesign Engine + Router</h1>
        <p>这是一个使用 @ldesign/engine-react 和路由系统构建的示例项目</p>
      </header>

      {/* 导航栏 */}
      <Navigation />

      <main className="main">
        {/* 路由视图 */}
        <RouterView routes={routes} />
      </main>

      <footer className="footer">
        <p>Powered by @ldesign/engine-react + @ldesign/router</p>
      </footer>
    </div>
  )
}

export default App

