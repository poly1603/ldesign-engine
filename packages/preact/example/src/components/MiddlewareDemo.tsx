import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'
import type { CoreEngine } from '@ldesign/engine-core'
import './demo-card.css'

export default function MiddlewareDemo() {
  const engine: CoreEngine = useEngine()
  const [middlewares, setMiddlewares] = useState<any[]>([])
  const [middlewareCount, setMiddlewareCount] = useState(0)
  const [executionLog, setExecutionLog] = useState<string[]>([])

  useEffect(() => {
    updateMiddlewareInfo()
  }, [])

  const updateMiddlewareInfo = () => {
    setMiddlewareCount(engine.middleware.size())
    setMiddlewares(Array.from(engine.middleware.getAll().values()))
  }

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
    <div class="demo-card">
      <h2>⚙️ 中间件系统演示</h2>
      <div class="demo-content">
        <div class="info-grid">
          <div class="info-item">
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
              <p class="empty">暂无中间件</p>
            )}
          </div>
          <div class="info-item">
            <strong>中间件数量:</strong>
            <span class="badge">{middlewareCount}</span>
          </div>
        </div>

        <div class="actions">
          <button onClick={executeMiddleware} class="btn btn-primary">
            执行中间件链
          </button>
          <button onClick={addMiddleware} class="btn btn-secondary">
            添加中间件
          </button>
        </div>

        {executionLog.length > 0 && (
          <div class="log">
            <strong>执行日志:</strong>
            <div class="log-entries">
              {executionLog.map((entry, index) => (
                <div key={index} class="log-entry">
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



