import React, { useState, useEffect } from 'react'
import { useEngine } from '@ldesign/engine-react'
import './DemoCard.css'

function StateDemo() {
  const engine = useEngine()
  const [count, setCount] = useState(0)
  const [user, setUser] = useState({ name: '', role: '' })
  const [theme, setTheme] = useState('light')
  const [stateKeys, setStateKeys] = useState<string[]>([])

  useEffect(() => {
    // 监听状态变化
    const countUnsub = engine.state.watch('count', (value: number) => {
      setCount(value)
    })

    const userUnsub = engine.state.watch('user', (value: any) => {
      setUser(value)
    })

    const themeUnsub = engine.state.watch('theme', (value: string) => {
      setTheme(value)
    })

    // 初始化状态
    setCount(engine.state.get('count') || 0)
    setUser(engine.state.get('user') || { name: '', role: '' })
    setTheme(engine.state.get('theme') || 'light')
    updateStateKeys()

    // 清理监听器
    return () => {
      countUnsub()
      userUnsub()
      themeUnsub()
    }
  }, [engine])

  const increment = () => {
    engine.state.set('count', count + 1)
  }

  const decrement = () => {
    engine.state.set('count', count - 1)
  }

  const handleSetTheme = (newTheme: string) => {
    engine.state.set('theme', newTheme)
  }

  const batchUpdate = () => {
    engine.state.batch(() => {
      engine.state.set('count', 100)
      engine.state.set('user', { name: '批量更新用户', role: 'superadmin' })
      engine.state.set('theme', 'dark')
    })
    updateStateKeys()
    alert('批量更新完成!')
  }

  const resetAll = () => {
    engine.state.set('count', 0)
    engine.state.set('user', { name: 'React 用户', role: 'admin' })
    engine.state.set('theme', 'light')
    updateStateKeys()
    alert('状态已重置!')
  }

  const updateStateKeys = () => {
    setStateKeys(engine.state.keys())
  }

  const getStateValue = (key: string) => {
    const value = engine.state.get(key)
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }

  return (
    <div className="demo-card">
      <h2>📦 状态管理演示</h2>
      <div className="demo-content">
        <div className="state-display">
          <div className="state-item">
            <strong>计数器:</strong>
            <div className="counter">
              <button onClick={decrement} className="btn btn-small">
                -
              </button>
              <span className="count">{count}</span>
              <button onClick={increment} className="btn btn-small">
                +
              </button>
            </div>
          </div>

          <div className="state-item">
            <strong>用户信息:</strong>
            <div className="user-info">
              <p>
                <strong>姓名:</strong> {user.name}
              </p>
              <p>
                <strong>角色:</strong> {user.role}
              </p>
            </div>
          </div>

          <div className="state-item">
            <strong>主题:</strong>
            <div className="theme-switcher">
              <button
                onClick={() => handleSetTheme('light')}
                className={`btn btn-small ${theme === 'light' ? 'active' : ''}`}
              >
                ☀️ 浅色
              </button>
              <button
                onClick={() => handleSetTheme('dark')}
                className={`btn btn-small ${theme === 'dark' ? 'active' : ''}`}
              >
                🌙 深色
              </button>
            </div>
          </div>
        </div>

        <div className="actions">
          <button onClick={batchUpdate} className="btn btn-primary">
            批量更新状态
          </button>
          <button onClick={resetAll} className="btn btn-secondary">
            重置所有状态
          </button>
        </div>

        <div className="state-list">
          <strong>所有状态:</strong>
          <div className="state-entries">
            {stateKeys.map((key) => (
              <div key={key} className="state-entry">
                <code>{key}</code>: {getStateValue(key)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StateDemo

