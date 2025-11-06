import React, { useState, useEffect } from 'react'
import { useEngine } from '@ldesign/engine-react'
import './DemoCard.css'

function MiddlewareDemo() {
  const engine = useEngine()
  const [middlewares, setMiddlewares] = useState<any[]>([])
  const [middlewareCount, setMiddlewareCount] = useState(0)
  const [executionLog, setExecutionLog] = useState<string[]>([])

  const updateMiddlewareInfo = () => {
    setMiddlewareCount(engine.middleware.size())
    setMiddlewares(Array.from(engine.middleware.getAll().values()))
  }

  useEffect(() => {
    updateMiddlewareInfo()
  }, [])

  const executeMiddleware = async () => {
    setExecutionLog([])
    const context = {
      data: { action: 'test', timestamp: Date.now() },
      cancelled: false,
    }

    try {
      await engine.middleware.execute(context)
      setExecutionLog([
        '✅ 中间件链执行完成',
        `📦 上下文数据: ${JSON.stringify(context.data)}`,
      ])
    } catch (error: any) {
      setExecutionLog([`❌ 执行失败: ${error.message}`])
    }
  }

  const addMiddleware = () => {
    const newMiddleware = {
      name: `middleware-${Date.now()}`,
      priority: Math.floor(Math.random() * 100),
      async execute(context: any, next: () => Promise<void>) {
        console.log(`🔄 ${newMiddleware.name} 执行前`)
        await next()
        console.log(`🔄 ${newMiddleware.name} 执行后`)
      },
    }

    engine.middleware.use(newMiddleware)
    updateMiddlewareInfo()
    alert(`中间件 ${newMiddleware.name} 添加成功!`)
  }

  return (
    <div className="demo-card">
      <h2>⚙️ 中间件系统演示</h2>
      <div className="demo-content">
        <div className="info-grid">
          <div className="info-item">
            <strong>已注册中间件:</strong>
            {middlewares.length > 0 ? (
              <ul>
                {middlewares.map((mw) => (
                  <li key={mw.name}>
                    {mw.name} (优先级: {mw.priority || 0})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">暂无中间件</p>
            )}
          </div>
          <div className="info-item">
            <strong>中间件数量:</strong>
            <span className="badge">{middlewareCount}</span>
          </div>
        </div>

        <div className="actions">
          <button onClick={executeMiddleware} className="btn btn-primary">
            执行中间件链
          </button>
          <button onClick={addMiddleware} className="btn btn-secondary">
            添加中间件
          </button>
        </div>

        {executionLog.length > 0 && (
          <div className="log">
            <strong>执行日志:</strong>
            <div className="log-entries">
              {executionLog.map((entry, index) => (
                <div key={index} className="log-entry">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MiddlewareDemo

