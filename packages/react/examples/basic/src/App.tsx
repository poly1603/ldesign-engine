import { useState, useEffect } from 'react'
import { useEngine } from '@ldesign/engine-react'
import './App.css'

function App() {
  const engine = useEngine()
  
  // i18n 状态
  const [currentLocale, setCurrentLocale] = useState(engine.getLocale())
  
  // 主题状态
  const [currentTheme, setCurrentTheme] = useState(engine.getTheme())
  
  // 尺寸状态
  const [currentSize, setCurrentSize] = useState(engine.getSize())
  
  // 计数器状态
  const [count, setCount] = useState(0)
  
  // 事件日志
  const [eventLog, setEventLog] = useState<string[]>([])
  
  // 切换语言
  const changeLocale = (locale: string) => {
    engine.setLocale(locale)
    setCurrentLocale(locale)
  }
  
  // 切换主题
  const changeTheme = (theme: string) => {
    engine.setTheme(theme)
    setCurrentTheme(theme)
  }
  
  // 切换尺寸
  const changeSize = (size: any) => {
    engine.setSize(size)
    setCurrentSize(size)
  }
  
  // 计数器操作
  const increment = () => {
    const newCount = count + 1
    setCount(newCount)
    engine.state.setState('counter', newCount)
  }
  
  const decrement = () => {
    const newCount = count - 1
    setCount(newCount)
    engine.state.setState('counter', newCount)
  }
  
  const reset = () => {
    setCount(0)
    engine.state.setState('counter', 0)
  }
  
  // 触发自定义事件
  const emitCustomEvent = () => {
    engine.events.emit('custom:event', {
      message: 'Hello from custom event!',
      timestamp: new Date().toISOString()
    })
  }
  
  // 添加事件到日志
  const addToLog = (message: string) => {
    setEventLog(prev => {
      const newLog = [message, ...prev]
      return newLog.slice(0, 5) // 只保留最近 5 条
    })
  }
  
  useEffect(() => {
    engine.logger.info('[App] Component mounted')
    
    // 从状态恢复计数
    const savedCount = engine.state.getState('counter')
    if (typeof savedCount === 'number') {
      setCount(savedCount)
    }
    
    // 监听事件
    const unsubscribeLocale = engine.events.on('locale:changed', (data: any) => {
      addToLog(`语言切换: ${data.from} → ${data.to}`)
    })
    
    const unsubscribeTheme = engine.events.on('theme:changed', (data: any) => {
      addToLog(`主题切换: ${data.from} → ${data.to}`)
    })
    
    const unsubscribeSize = engine.events.on('size:changed', (data: any) => {
      addToLog(`尺寸切换: ${data.from} → ${data.to}`)
    })
    
    const unsubscribeCustom = engine.events.on('custom:event', (data: any) => {
      addToLog(`自定义事件: ${data.message}`)
    })
    
    // 清理
    return () => {
      unsubscribeLocale()
      unsubscribeTheme()
      unsubscribeSize()
      unsubscribeCustom()
      engine.logger.info('[App] Component unmounted')
    }
  }, [engine])
  
  return (
    <div className="app">
      <header className="header">
        <h1>@ldesign/engine React Example</h1>
        <p>演示所有引擎功能</p>
      </header>

      <main className="main">
        {/* i18n 插件示例 */}
        <section className="section">
          <h2>🌍 i18n 插件</h2>
          <div className="content">
            <p>{engine.t('hello')}</p>
            <p>{engine.t('welcome', { name: 'Tom' })}</p>
            <p>当前语言: {currentLocale}</p>
            <div className="buttons">
              <button onClick={() => changeLocale('zh-CN')}>中文</button>
              <button onClick={() => changeLocale('en-US')}>English</button>
            </div>
          </div>
        </section>

        {/* 主题插件示例 */}
        <section className="section">
          <h2>🎨 主题插件</h2>
          <div className="content">
            <p>当前主题: {currentTheme}</p>
            <div className="buttons">
              <button onClick={() => changeTheme('light')}>浅色</button>
              <button onClick={() => changeTheme('dark')}>深色</button>
            </div>
          </div>
        </section>

        {/* 尺寸插件示例 */}
        <section className="section">
          <h2>📏 尺寸插件</h2>
          <div className="content">
            <p>当前尺寸: {currentSize}</p>
            <div className="buttons">
              <button onClick={() => changeSize('small')}>小</button>
              <button onClick={() => changeSize('medium')}>中</button>
              <button onClick={() => changeSize('large')}>大</button>
            </div>
          </div>
        </section>

        {/* 状态管理示例 */}
        <section className="section">
          <h2>📦 状态管理</h2>
          <div className="content">
            <p>计数: {count}</p>
            <div className="buttons">
              <button onClick={increment}>+1</button>
              <button onClick={decrement}>-1</button>
              <button onClick={reset}>重置</button>
            </div>
          </div>
        </section>

        {/* 事件系统示例 */}
        <section className="section">
          <h2>📡 事件系统</h2>
          <div className="content">
            <p>事件日志:</p>
            <ul className="event-log">
              {eventLog.map((event, index) => (
                <li key={index}>{event}</li>
              ))}
            </ul>
            <button onClick={emitCustomEvent}>触发自定义事件</button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
