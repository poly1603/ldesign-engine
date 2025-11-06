import { Component, createSignal, createEffect, onMount } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'
import './DemoCard.css'

const StateDemo: Component = () => {
  const engine = useEngine()
  const [count, setCount] = createSignal(0)
  const [user, setUser] = createSignal({ name: '', role: '' })
  const [theme, setTheme] = createSignal('light')
  const [stateKeys, setStateKeys] = createSignal<string[]>([])

  createEffect(() => {
    const countUnsub = engine.state.watch('count', (value: number) => {
      setCount(value)
    })

    const userUnsub = engine.state.watch('user', (value: any) => {
      setUser(value)
    })

    const themeUnsub = engine.state.watch('theme', (value: string) => {
      setTheme(value)
    })

    return () => {
      countUnsub()
      userUnsub()
      themeUnsub()
    }
  })

  onMount(() => {
    setCount(engine.state.get('count') || 0)
    setUser(engine.state.get('user') || { name: '', role: '' })
    setTheme(engine.state.get('theme') || 'light')
    updateStateKeys()
  })

  const increment = () => {
    engine.state.set('count', count() + 1)
  }

  const decrement = () => {
    engine.state.set('count', count() - 1)
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
    engine.state.set('user', { name: 'Solid 用户', role: 'admin' })
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
    <div class="demo-card">
      <h2>📦 状态管理演示</h2>
      <div class="demo-content">
        <div class="state-display">
          <div class="state-item">
            <strong>计数器:</strong>
            <div class="counter">
              <button onClick={decrement} class="btn btn-small">-</button>
              <span class="count">{count()}</span>
              <button onClick={increment} class="btn btn-small">+</button>
            </div>
          </div>

          <div class="state-item">
            <strong>用户信息:</strong>
            <div class="user-info">
              <p><strong>姓名:</strong> {user().name}</p>
              <p><strong>角色:</strong> {user().role}</p>
            </div>
          </div>

          <div class="state-item">
            <strong>主题:</strong>
            <div class="theme-switcher">
              <button
                onClick={() => handleSetTheme('light')}
                class={`btn btn-small ${theme() === 'light' ? 'active' : ''}`}
              >
                ☀️ 浅色
              </button>
              <button
                onClick={() => handleSetTheme('dark')}
                class={`btn btn-small ${theme() === 'dark' ? 'active' : ''}`}
              >
                🌙 深色
              </button>
            </div>
          </div>
        </div>

        <div class="actions">
          <button onClick={batchUpdate} class="btn btn-primary">
            批量更新状态
          </button>
          <button onClick={resetAll} class="btn btn-secondary">
            重置所有状态
          </button>
        </div>

        <div class="state-list">
          <strong>所有状态:</strong>
          <div class="state-entries">
            {stateKeys().map((key) => (
              <div class="state-entry">
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

