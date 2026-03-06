<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { AlertTriangle, Plus, Trash2, Shield, BookOpen, Lightbulb } from 'lucide-vue-next'
import { ErrorManager, LDesignError, ErrorCode, ErrorSeverity } from '@ldesign/engine-core'

const em = ErrorManager.getInstance()

// 日志
const handlerLogs = reactive<{ text: string; severity: string; time: string }[]>([])

// 注册全局处理器
em.register((error) => {
  handlerLogs.push({
    text: `[${error.code}] ${error.message}`,
    severity: error.severity,
    time: new Date().toLocaleTimeString(),
  })
})

const errorLog = computed(() => em.getErrorLog())
const stats = computed(() => em.getStats())

const customCode = ref(ErrorCode.ENGINE_INIT_FAILED)
const customMsg = ref('引擎初始化失败')
const customSeverity = ref(ErrorSeverity.HIGH)

const errorCodes = [
  { label: 'ENGINE_INIT_FAILED (1001)', value: ErrorCode.ENGINE_INIT_FAILED },
  { label: 'ENGINE_PLUGIN_LOAD_FAILED (1002)', value: ErrorCode.ENGINE_PLUGIN_LOAD_FAILED },
  { label: 'ROUTER_NOT_FOUND (2003)', value: ErrorCode.ROUTER_NOT_FOUND },
  { label: 'HTTP_TIMEOUT (6002)', value: ErrorCode.HTTP_TIMEOUT },
  { label: 'UNKNOWN_ERROR (9999)', value: ErrorCode.UNKNOWN_ERROR },
]

const severities = [
  { label: 'LOW', value: ErrorSeverity.LOW },
  { label: 'MEDIUM', value: ErrorSeverity.MEDIUM },
  { label: 'HIGH', value: ErrorSeverity.HIGH },
  { label: 'CRITICAL', value: ErrorSeverity.CRITICAL },
]

function throwError() {
  const err = new LDesignError(customCode.value, customMsg.value, {
    severity: customSeverity.value,
    context: { module: 'playground', operation: 'demo' },
    recoverable: true,
  })
  em.handle(err)
}

function throwQuick(code: ErrorCode, msg: string) {
  em.handle(new LDesignError(code, msg))
}

function clearLogs() {
  em.clearErrorLog()
  handlerLogs.length = 0
}

function severityColor(s: string) {
  switch (s) {
    case 'low': return 'var(--c-success)'
    case 'medium': return 'var(--c-warning)'
    case 'high': return 'var(--c-danger)'
    case 'critical': return '#d32f2f'
    default: return 'var(--c-text-2)'
  }
}
function severityBadge(s: string) {
  switch (s) {
    case 'low': return 'badge-success'
    case 'medium': return 'badge-warning'
    case 'high': return 'badge-danger'
    case 'critical': return 'badge-danger'
    default: return ''
  }
}
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><AlertTriangle :size="22" /> 错误处理</h1>
      <p>统一错误码、严重级别分类、全局/级别处理器、错误日志与统计</p>
    </div>

    <div class="card">
      <div class="card-title">错误统计</div>
      <div class="stat-grid">
        <div class="stat-card" style="background: var(--c-danger-bg);"><div class="stat-value" style="color: var(--c-danger);">{{ stats.total }}</div><div class="stat-label">总错误</div></div>
        <div v-for="s in severities" :key="s.value" class="stat-card">
          <div class="stat-value" :style="{ color: severityColor(s.value) }">{{ stats.bySeverity[s.value] || 0 }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">触发错误</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <select v-model="customCode" class="input" style="width: 240px;">
          <option v-for="c in errorCodes" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <input v-model="customMsg" class="input" placeholder="错误消息" style="width: 200px;" />
        <select v-model="customSeverity" class="input" style="width: 120px;">
          <option v-for="s in severities" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <button class="btn btn-danger" @click="throwError"><Plus :size="14" /> 触发错误</button>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn" @click="throwQuick(ErrorCode.ENGINE_PLUGIN_LOAD_FAILED, '插件加载失败')"><Shield :size="14" /> 插件错误</button>
        <button class="btn" @click="throwQuick(ErrorCode.ROUTER_NOT_FOUND, '页面未找到')"><Shield :size="14" /> 路由错误</button>
        <button class="btn" @click="throwQuick(ErrorCode.HTTP_TIMEOUT, '请求超时')"><Shield :size="14" /> HTTP 超时</button>
        <button class="btn btn-danger" @click="clearLogs"><Trash2 :size="14" /> 清除日志</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">处理器日志</div>
      <div v-if="handlerLogs.length" class="log-list">
        <div v-for="(l, i) in handlerLogs" :key="i" class="log-item">
          <span class="badge" :class="severityBadge(l.severity)">{{ l.severity }}</span>
          <span>{{ l.text }}</span>
          <span class="log-time">{{ l.time }}</span>
        </div>
      </div>
      <div v-else class="empty-state">暂无错误日志</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>创建错误</h4>
      <pre class="code-block">import { LDesignError, ErrorCode, ErrorSeverity } from '@ldesign/engine-core'

const error = new LDesignError(
  ErrorCode.ENGINE_INIT_FAILED,
  '引擎初始化失败',
  {
    severity: ErrorSeverity.HIGH,
    context: { module: 'engine', operation: 'init' },
    originalError: catchedError,
    recoverable: true,
  }
)</pre>

      <h4>错误码分类</h4>
      <p>错误码按模块分段：1xxx 引擎、2xxx 路由、3xxx 国际化、4xxx 颜色、5xxx 尺寸、6xxx HTTP、9xxx 通用。</p>

      <h4>ErrorManager — 全局错误管理</h4>
      <pre class="code-block">const em = ErrorManager.getInstance()

// 注册全局处理器
em.register((error) =&gt; {
  console.error(`[${error.severity}]`, error.message)
})

// 注册特定级别处理器
em.register((error) =&gt; {
  alert('严重错误: ' + error.message)
}, ErrorSeverity.CRITICAL)

// 分发错误
await em.handle(error)

// 查看日志与统计
em.getErrorLog()       // LDesignError[]
em.getStats()          // { total, bySeverity, byModule, byCode }
em.clearErrorLog()     // 清空</pre>

      <h4>专用错误类</h4>
      <p>框架提供多个子类：<code>EngineError</code>、<code>RouterError</code>、<code>I18nError</code>、<code>ColorError</code>、<code>SizeError</code>、<code>HttpError</code>，自动设置 module context。</p>
      <pre class="code-block">import { HttpError, ErrorCode } from '@ldesign/engine-core'

throw new HttpError(ErrorCode.HTTP_TIMEOUT, '请求超时', {
  statusCode: 408,
  response: null,
})</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>统一错误上报</strong><span>全局处理器将错误统一发送至监控平台（如 Sentry）。</span></div>
        <div class="scenario"><strong>分级告警</strong><span>按严重级别触发不同告警策略：LOW 日志、HIGH 邮件、CRITICAL 短信。</span></div>
        <div class="scenario"><strong>错误恢复</strong><span>recoverable 标记支持自动重试或降级。</span></div>
        <div class="scenario"><strong>错误追溯</strong><span>context 记录模块、操作、时间戳，便于排查。</span></div>
      </div>
    </div>
  </div>
</template>
