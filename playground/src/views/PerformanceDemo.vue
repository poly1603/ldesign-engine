<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Gauge, Play, BarChart3, Trash2, BookOpen, Lightbulb } from 'lucide-vue-next'
import { PerformanceMonitor } from '@ldesign/engine-core'
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()
const monitor = new PerformanceMonitor({ maxSamples: 500, slowOperationThreshold: 100, enableWarnings: true })

const measureName = ref('test-operation')
const measureDelay = ref(50)
const measureLogs = reactive<{ name: string; duration: string; time: string }[]>([])
const overview = ref(monitor.getPerformanceOverview())
const allStats = ref<Map<string, any>>(new Map())

async function runMeasure() {
  const name = measureName.value || 'test-operation'
  const delay = measureDelay.value
  await monitor.measureAsync(name, () => new Promise(r => setTimeout(r, delay + Math.random() * 20)))
  measureLogs.push({ name, duration: `${delay}~${delay + 20}ms`, time: new Date().toLocaleTimeString() })
  refreshStats()
}

async function runBatch() {
  const tasks = ['db-query', 'api-call', 'render', 'cache-lookup']
  for (const t of tasks) {
    const d = Math.random() * 80 + 10
    await monitor.measureAsync(t, () => new Promise(r => setTimeout(r, d)))
    measureLogs.push({ name: t, duration: `${d.toFixed(1)}ms`, time: new Date().toLocaleTimeString() })
  }
  refreshStats()
}

function runSync() {
  const name = 'sync-compute'
  monitor.measure(name, () => {
    let sum = 0
    for (let i = 0; i < 1e6; i++) sum += Math.sqrt(i)
    return sum
  })
  measureLogs.push({ name, duration: 'sync', time: new Date().toLocaleTimeString() })
  refreshStats()
}

function refreshStats() {
  overview.value = monitor.getPerformanceOverview()
  allStats.value = monitor.getAllStats()
}

function clearAll() {
  monitor.clearAll()
  measureLogs.length = 0
  refreshStats()
}

// 中间件性能测试
const middlewareLogs = reactive<string[]>([])

async function runMiddlewarePerf() {
  middlewareLogs.length = 0
  // 注册测试中间件 — 使用正确的 {name, execute} 格式
  const names = ['auth', 'validate', 'transform']
  for (const n of names) {
    engine.middleware.use({
      name: `perf-${n}`,
      priority: 10,
      execute: async (ctx: any, next: () => void | Promise<void>) => {
        const id = monitor.start(`middleware:${n}`)
        await new Promise(r => setTimeout(r, Math.random() * 30 + 5))
        await next()
        const dur = monitor.end(id)
        middlewareLogs.push(`${n}: ${dur?.toFixed(2)}ms`)
      }
    })
  }
  await engine.middleware.execute({ data: { action: 'perf-test' } })
  // 清理
  for (const n of names) { engine.middleware.remove(`perf-${n}`) }
  refreshStats()
}
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Gauge :size="22" /> 性能监控</h1>
      <p>高精度计时、百分位统计（P50/P95/P99）、慢操作检测、中间件耗时分析</p>
    </div>

    <div class="card">
      <div class="card-title">性能总览</div>
      <div class="stat-grid">
        <div class="stat-card" style="background: var(--c-primary-bg);"><div class="stat-value" style="color: var(--c-primary);">{{ overview.totalMetrics }}</div><div class="stat-label">指标类型</div></div>
        <div class="stat-card" style="background: var(--c-success-bg);"><div class="stat-value" style="color: var(--c-success);">{{ overview.totalOperations }}</div><div class="stat-label">总操作数</div></div>
        <div class="stat-card" style="background: var(--c-warning-bg);"><div class="stat-value" style="color: var(--c-warning);">{{ overview.avgDuration.toFixed(1) }}ms</div><div class="stat-label">平均耗时</div></div>
        <div class="stat-card" style="background: var(--c-danger-bg);"><div class="stat-value" style="color: var(--c-danger);">{{ overview.slowOperations }}</div><div class="stat-label">慢操作</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">测量操作</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <input v-model="measureName" class="input" placeholder="操作名称" style="width: 150px;" />
        <input v-model.number="measureDelay" class="input" type="number" placeholder="延迟 ms" style="width: 80px;" />
        <button class="btn btn-primary" @click="runMeasure"><Play :size="14" /> 异步测量</button>
        <button class="btn btn-success" @click="runSync"><Play :size="14" /> 同步测量</button>
        <button class="btn btn-warning" @click="runBatch"><BarChart3 :size="14" /> 批量测量</button>
        <button class="btn" @click="runMiddlewarePerf"><Gauge :size="14" /> 中间件耗时</button>
        <button class="btn btn-danger" @click="clearAll"><Trash2 :size="14" /> 清除</button>
      </div>

      <div v-if="middlewareLogs.length" style="margin-bottom: 12px;">
        <h4 style="margin-bottom: 4px;">中间件耗时</h4>
        <div v-for="(l, i) in middlewareLogs" :key="'mw'+i" class="log-item"><span class="badge badge-info">MW</span> {{ l }}</div>
      </div>

      <div v-if="measureLogs.length" class="log-list">
        <div v-for="(l, i) in measureLogs" :key="i" class="log-item">
          <span class="badge badge-primary">{{ l.name }}</span>
          <span>{{ l.duration }}</span>
          <span class="log-time">{{ l.time }}</span>
        </div>
      </div>
      <div v-else class="empty-state">点击按钮开始测量</div>
    </div>

    <div class="card">
      <div class="card-title">详细统计</div>
      <div v-if="allStats.size">
        <div v-for="[name, stats] in allStats" :key="name" style="border-bottom: 1px solid var(--c-border); padding: 8px 0;">
          <div style="font-weight: 600; margin-bottom: 4px; font-family: monospace;">{{ name }}</div>
          <div class="stat-grid" style="grid-template-columns: repeat(4, 1fr);">
            <div class="stat-card"><div class="stat-value" style="font-size: 14px;">{{ stats.count }}</div><div class="stat-label">次数</div></div>
            <div class="stat-card"><div class="stat-value" style="font-size: 14px;">{{ stats.avgDuration.toFixed(2) }}ms</div><div class="stat-label">平均</div></div>
            <div class="stat-card"><div class="stat-value" style="font-size: 14px;">{{ stats.p95.toFixed(2) }}ms</div><div class="stat-label">P95</div></div>
            <div class="stat-card"><div class="stat-value" style="font-size: 14px;">{{ stats.maxDuration.toFixed(2) }}ms</div><div class="stat-label">最大</div></div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">暂无统计数据</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>创建监控器</h4>
      <pre class="code-block">import { PerformanceMonitor } from '@ldesign/engine-core'

const monitor = new PerformanceMonitor({
  maxSamples: 1000,          // 最大样本数
  sampleRate: 1.0,           // 采样率 (0~1)
  slowOperationThreshold: 1000, // 慢操作阈值 ms
  enableWarnings: true,      // 控制台警告
})</pre>

      <h4>手动计时</h4>
      <pre class="code-block">const id = monitor.start('my-operation')
// ... 执行操作 ...
const duration = monitor.end(id) // 返回 ms</pre>

      <h4>自动计时</h4>
      <pre class="code-block">// 同步
const result = monitor.measure('compute', () =&gt; heavyCalc())

// 异步
const data = await monitor.measureAsync('fetch', () =&gt; fetch(url))</pre>

      <h4>统计分析</h4>
      <p>每个指标自动计算 count、avg、min、max、P50、P95、P99。</p>
      <pre class="code-block">const stats = monitor.getStats('my-operation')
// { count, totalDuration, avgDuration, minDuration, maxDuration, p50, p95, p99 }

const overview = monitor.getPerformanceOverview()
// { totalMetrics, totalOperations, slowOperations, avgDuration, topSlowest }

const slow = monitor.getSlowOperations(500)
// [{ name, avgDuration, maxDuration, count }]</pre>

      <h4>与中间件结合</h4>
      <pre class="code-block">engine.middleware.use({
  name: 'performance-tracker',
  priority: 100,
  execute: async (ctx, next) =&gt; {
    const id = monitor.start('middleware-pipeline')
    await next()
    monitor.end(id)
  }
})</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>API 耗时分析</strong><span>追踪每个接口调用耗时，发现慢接口并优化。</span></div>
        <div class="scenario"><strong>插件加载监控</strong><span>测量各插件初始化时间，识别启动瓶颈。</span></div>
        <div class="scenario"><strong>渲染性能</strong><span>结合 requestAnimationFrame 监控渲染帧率。</span></div>
        <div class="scenario"><strong>性能回归检测</strong><span>CI 中对比 P95 指标，自动发现性能退化。</span></div>
      </div>
    </div>
  </div>
</template>
