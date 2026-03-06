<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Package, Plus, RefreshCw, Layers, BookOpen, Lightbulb } from 'lucide-vue-next'
import { ServiceContainerImpl } from '@ldesign/engine-core'

const container = new ServiceContainerImpl()
const logs = reactive<{ text: string; type: string; time: string }[]>([])
const resolveStats = ref<ReturnType<ServiceContainerImpl['getResolveStats']>>({ totalResolves: 0, topServices: [], slowestServices: [] })

function log(text: string, type = 'info') {
  logs.push({ text, type, time: new Date().toLocaleTimeString() })
}

// 注册示例服务
let instanceCount = 0

container.singleton('logger', () => {
  instanceCount++
  const id = instanceCount
  log(`创建 Logger 实例 #${id} (单例)`, 'success')
  return { id, log: (msg: string) => `[Logger#${id}] ${msg}` }
})

container.transient('requestId', () => {
  instanceCount++
  const id = instanceCount
  log(`创建 RequestId 实例 #${id} (瞬态)`, 'warning')
  return { id, value: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
})

container.scoped('session', () => {
  instanceCount++
  const id = instanceCount
  log(`创建 Session 实例 #${id} (作用域)`, 'info')
  return { id, token: `sess-${Math.random().toString(36).slice(2, 10)}` }
})

const singletonResults = ref<string[]>([])
const transientResults = ref<string[]>([])
const scopedResults = ref<string[]>([])

function resolveSingleton() {
  const svc = container.resolve<any>('logger')
  singletonResults.value.push(`实例 #${svc.id}: ${svc.log('hello')}`)
  resolveStats.value = container.getResolveStats()
}

function resolveTransient() {
  const svc = container.resolve<any>('requestId')
  transientResults.value.push(`实例 #${svc.id}: ${svc.value}`)
  resolveStats.value = container.getResolveStats()
}

function resolveScoped() {
  const scope = container.createScope() as ServiceContainerImpl
  const s1 = scope.resolve<any>('session')
  const s2 = scope.resolve<any>('session')
  scopedResults.value.push(`同作用域: #${s1.id} === #${s2.id} → ${s1 === s2 ? '相同 ✓' : '不同 ✗'}`)
  resolveStats.value = container.getResolveStats()
}

function resetAll() {
  container.resetResolveStats()
  singletonResults.value = []
  transientResults.value = []
  scopedResults.value = []
  logs.length = 0
  resolveStats.value = { totalResolves: 0, topServices: [], slowestServices: [] }
}
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Package :size="22" /> 依赖注入容器</h1>
      <p>服务注册与解析：单例、瞬态、作用域三种生命周期，循环依赖检测</p>
    </div>

    <div class="card">
      <div class="card-title">生命周期演示</div>
      <div class="stat-grid" style="margin-bottom: 16px;">
        <div class="stat-card" style="background: var(--c-success-bg);">
          <div class="stat-value" style="color: var(--c-success);">{{ resolveStats.totalResolves }}</div>
          <div class="stat-label">总解析次数</div>
        </div>
        <div class="stat-card" style="background: var(--c-primary-bg);">
          <div class="stat-value" style="color: var(--c-primary);">{{ resolveStats.topServices.length }}</div>
          <div class="stat-label">已注册服务</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <button class="btn btn-success" @click="resolveSingleton"><Layers :size="14" /> 解析单例 Logger</button>
        <button class="btn btn-warning" @click="resolveTransient"><Plus :size="14" /> 解析瞬态 RequestId</button>
        <button class="btn btn-primary" @click="resolveScoped"><Package :size="14" /> 解析作用域 Session</button>
        <button class="btn btn-danger" @click="resetAll"><RefreshCw :size="14" /> 重置</button>
      </div>

      <div v-if="singletonResults.length" style="margin-bottom: 12px;">
        <h4 style="color: var(--c-success); margin-bottom: 4px;">单例 (Singleton) — 始终返回同一实例</h4>
        <div v-for="(r, i) in singletonResults" :key="'s'+i" class="log-item"><span class="badge badge-success">S</span> {{ r }}</div>
      </div>
      <div v-if="transientResults.length" style="margin-bottom: 12px;">
        <h4 style="color: var(--c-warning); margin-bottom: 4px;">瞬态 (Transient) — 每次创建新实例</h4>
        <div v-for="(r, i) in transientResults" :key="'t'+i" class="log-item"><span class="badge badge-warning">T</span> {{ r }}</div>
      </div>
      <div v-if="scopedResults.length" style="margin-bottom: 12px;">
        <h4 style="color: var(--c-primary); margin-bottom: 4px;">作用域 (Scoped) — 同作用域内共享</h4>
        <div v-for="(r, i) in scopedResults" :key="'sc'+i" class="log-item"><span class="badge badge-primary">Sc</span> {{ r }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">创建日志</div>
      <div v-if="logs.length" class="log-list">
        <div v-for="(l, i) in logs" :key="i" class="log-item">
          <span class="badge" :class="'badge-' + l.type">{{ l.type }}</span>
          <span>{{ l.text }}</span>
          <span class="log-time">{{ l.time }}</span>
        </div>
      </div>
      <div v-else class="empty-state">点击上方按钮查看实例创建过程</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>创建容器 &amp; 注册服务</h4>
      <pre class="code-block">import { ServiceContainerImpl } from '@ldesign/engine-core'

const container = new ServiceContainerImpl()

// 单例 — 全局唯一实例
container.singleton('logger', () =&gt; new Logger())

// 瞬态 — 每次 resolve 都创建新实例
container.transient('request', () =&gt; new Request())

// 作用域 — 同一 scope 内共享
container.scoped('session', () =&gt; new Session())</pre>

      <h4>解析服务</h4>
      <pre class="code-block">const logger = container.resolve&lt;Logger&gt;('logger')

// 可选解析（不存在不抛错）
const opt = container.resolve('maybe', { optional: true, defaultValue: null })

// 异步解析
const svc = await container.resolveAsync&lt;MyService&gt;('myService')</pre>

      <h4>作用域</h4>
      <p>使用 <code>createScope()</code> 创建子容器，作用域服务在子容器内共享实例。</p>
      <pre class="code-block">const scope = container.createScope()
const s1 = scope.resolve('session')
const s2 = scope.resolve('session')
console.log(s1 === s2) // true — 同一作用域

const scope2 = container.createScope()
const s3 = scope2.resolve('session')
console.log(s1 === s3) // false — 不同作用域</pre>

      <h4>服务提供者</h4>
      <pre class="code-block">const provider = {
  async register(container) {
    container.singleton('db', () =&gt; new Database())
    container.singleton('cache', () =&gt; new Redis())
  },
  async boot(container) {
    const db = container.resolve('db')
    await db.connect()
  }
}
await container.addProvider(provider)</pre>

      <h4>解析统计</h4>
      <pre class="code-block">const stats = container.getResolveStats()
// { totalResolves, topServices, slowestServices }
container.resetResolveStats()</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>微内核插件系统</strong><span>插件通过容器注册和获取服务，实现松耦合。</span></div>
        <div class="scenario"><strong>请求级隔离</strong><span>Web 服务中每个请求创建作用域，事务/连接自动隔离。</span></div>
        <div class="scenario"><strong>测试 Mock</strong><span>注册 Mock 实现替换真实服务，无需修改业务代码。</span></div>
        <div class="scenario"><strong>模块化应用</strong><span>通过 ServiceProvider 模式按模块组织服务注册和启动逻辑。</span></div>
      </div>
    </div>
  </div>
</template>
