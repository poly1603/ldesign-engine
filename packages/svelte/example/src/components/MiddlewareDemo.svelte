<script lang="ts">
  import { getEngineContext } from '@ldesign/engine-svelte'
  import './DemoCard.css'

  const engine = getEngineContext()

  let middlewares = $state<any[]>([])
  let middlewareCount = $state(0)
  let executionLog = $state<string[]>([])

  function updateMiddlewareInfo() {
    middlewareCount = engine.middleware.size()
    middlewares = Array.from(engine.middleware.getAll().values())
  }

  // 初始化
  $effect(() => {
    updateMiddlewareInfo()
  })

  async function executeMiddleware() {
    executionLog = []
    const context = {
      data: { action: 'test', timestamp: Date.now() },
      cancelled: false,
    }

    try {
      await engine.middleware.execute(context)
      executionLog = [
        '✅ 中间件链执行完成',
        `📦 上下文数据: ${JSON.stringify(context.data)}`,
      ]
    } catch (error: any) {
      executionLog = [`❌ 执行失败: ${error.message}`]
    }
  }

  function addMiddleware() {
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
</script>

<div class="demo-card">
  <h2>⚙️ 中间件系统演示</h2>
  <div class="demo-content">
    <div class="info-grid">
      <div class="info-item">
        <strong>已注册中间件:</strong>
        {#if middlewares.length > 0}
          <ul>
            {#each middlewares as mw (mw.name)}
              <li>{mw.name} (优先级: {mw.priority || 0})</li>
            {/each}
          </ul>
        {:else}
          <p class="empty">暂无中间件</p>
        {/if}
      </div>
      <div class="info-item">
        <strong>中间件数量:</strong>
        <span class="badge">{middlewareCount}</span>
      </div>
    </div>

    <div class="actions">
      <button onclick={executeMiddleware} class="btn btn-primary">
        执行中间件链
      </button>
      <button onclick={addMiddleware} class="btn btn-secondary">
        添加中间件
      </button>
    </div>

    {#if executionLog.length > 0}
      <div class="log">
        <strong>执行日志:</strong>
        <div class="log-entries">
          {#each executionLog as entry}
            <div class="log-entry">{entry}</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
