<script setup lang="ts">
import { ref } from 'vue'
import { Layers, Play, Trash2, BookOpen, Lightbulb } from 'lucide-vue-next'
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()
const executionLog = ref<string[]>([])
const executing = ref(false)

async function runMiddlewareChain() {
  executionLog.value = []
  executing.value = true

  const log = (msg: string) => { executionLog.value = [...executionLog.value, msg] }

  const names = ['Auth', 'Logger', 'Validator']
  const ids: string[] = []

  for (const [i, name] of names.entries()) {
    const mw = {
      name: `demo-${name.toLowerCase()}`,
      priority: 100 - i * 10,
      async execute(ctx: any, next: () => void | Promise<void>) {
        log(`→ [${name}] 进入 (priority: ${100 - i * 10})`)
        await new Promise(r => setTimeout(r, 300))
        await next()
        await new Promise(r => setTimeout(r, 200))
        log(`← [${name}] 离开`)
      },
    }
    engine.middleware.use(mw)
    ids.push(mw.name)
  }

  try {
    log('开始执行中间件链...')
    await engine.middleware.execute({ data: { action: 'demo-request' } })
    log('中间件链执行完成 ✓')
  } finally {
    for (const id of ids) { engine.middleware.remove(id) }
    executing.value = false
  }
}
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Layers :size="22" /> 中间件系统</h1>
      <p>洋葱模型中间件链、优先级排序、错误隔离</p>
    </div>

    <div class="card">
      <div class="card-title">洋葱模型演示</div>
      <p style="font-size: 13px; color: var(--c-text-2); margin-bottom: 16px;">
        3 个中间件按优先级排序，执行时先进后出：Auth → Logger → Validator → Validator → Logger → Auth
      </p>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="executing" @click="runMiddlewareChain">
          <Play :size="16" /> {{ executing ? '执行中...' : '执行中间件链' }}
        </button>
        <button class="btn" @click="executionLog = []"><Trash2 :size="16" /> 清空</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">执行日志</div>
      <div v-if="executionLog.length" class="log-list">
        <div v-for="(log, i) in executionLog" :key="i" class="log-item">
          <span class="log-time">{{ String(i + 1).padStart(2, '0') }}</span>
          <span :class="['badge', log.startsWith('→') ? 'badge-success' : log.startsWith('←') ? 'badge-warning' : 'badge-primary']" style="font-family: monospace;">
            {{ log }}
          </span>
        </div>
      </div>
      <div v-else class="empty-state">点击上方按钮执行中间件链</div>
    </div>

    <!-- 使用指南 -->
    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>

    <div class="card doc-section">
      <h4>注册中间件</h4>
      <p>中间件是一个包含 <code>name</code>、<code>execute</code> 方法的对象，可选 <code>priority</code>（数值越大越先执行）和 <code>onError</code> 错误处理器。</p>
      <pre class="code-block">engine.middleware.use({
  name: 'auth-check',
  priority: 100,   // 越大越先执行

  async execute(ctx, next) {
    console.log('请求前：检查认证')
    if (!ctx.data.token) {
      ctx.cancelled = true  // 取消后续中间件
      return
    }
    await next()             // 调用下一个中间件
    console.log('请求后：记录日志')
  },

  onError(error, ctx) {     // 可选：错误处理
    console.error('认证失败:', error)
  },
})</pre>

      <h4>执行中间件链</h4>
      <p>调用 <code>execute</code> 传入上下文对象，上下文包含 <code>data</code>（业务数据）和可选的 <code>cancelled</code>（取消标志）。</p>
      <pre class="code-block">await engine.middleware.execute({
  data: { url: '/api/users', method: 'GET', token: 'xxx' },
  cancelled: false,
})

// 中间件可以修改 ctx.data，后续中间件看到的是修改后的值
// 设置 ctx.cancelled = true 将跳过后续中间件</pre>

      <h4>管理中间件</h4>
      <pre class="code-block">engine.middleware.remove('auth-check')     // 按名称移除
engine.middleware.get('auth-check')        // 获取中间件
engine.middleware.getAll()                 // 获取所有
engine.middleware.size()                   // 获取数量
engine.middleware.clear()                  // 清空</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>请求管道</strong><span>HTTP 请求前添加认证 token、请求后统一处理错误，类似 Axios 拦截器但更灵活。</span></div>
        <div class="scenario"><strong>数据验证</strong><span>在数据写入前通过中间件链进行多层校验，每层负责不同规则（格式、权限、业务）。</span></div>
        <div class="scenario"><strong>日志追踪</strong><span>在操作前后自动记录耗时、参数和结果，无需修改业务代码即可添加可观测性。</span></div>
        <div class="scenario"><strong>权限守卫</strong><span>在路由跳转或 API 调用前检查用户权限，不通过则取消操作（设置 ctx.cancelled）。</span></div>
      </div>
    </div>
  </div>
</template>
