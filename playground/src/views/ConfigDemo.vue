<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Settings, Plus, Trash2, Save, RotateCcw, BookOpen, Lightbulb } from 'lucide-vue-next'
import { ConfigManagerImpl } from '@ldesign/engine-core'

const config = new ConfigManagerImpl({
  environment: 'development',
  defaults: {
    app: { name: 'LDesign Playground', version: '1.0.0', debug: true },
    theme: { primary: '#4f46e5', mode: 'light' },
    api: { baseUrl: 'https://api.example.com', timeout: 5000 },
  },
})

const newKey = ref('app.title')
const newValue = ref('"Hello LDesign"')
const watchLogs = reactive<{ key: string; value: string; time: string }[]>([])

// 监听所有变化
config.watch((value) => {
  watchLogs.push({ key: '(global)', value: JSON.stringify(value).slice(0, 60), time: new Date().toLocaleTimeString() })
})

const allConfig = ref(config.getAll())
const env = ref(config.getEnvironment())

function refreshConfig() { allConfig.value = config.getAll(); env.value = config.getEnvironment() }

function setConfig() {
  const k = newKey.value.trim(); if (!k) return
  let val: any = newValue.value
  try { val = JSON.parse(newValue.value) } catch {}
  config.set(k, val); refreshConfig()
}

function deleteConfig(key: string) { config.delete(key); refreshConfig() }

function switchEnv(e: string) {
  config.setEnvironment(e as any)
  refreshConfig()
}

function exportJson() {
  const json = config.export('json')
  navigator.clipboard?.writeText(json)
  watchLogs.push({ key: 'export', value: '已复制到剪贴板', time: new Date().toLocaleTimeString() })
}

function resetConfig() {
  config.clear()
  config.set('app', { name: 'LDesign Playground', version: '1.0.0', debug: true })
  config.set('theme', { primary: '#4f46e5', mode: 'light' })
  config.set('api', { baseUrl: 'https://api.example.com', timeout: 5000 })
  refreshConfig()
}

// 展开嵌套对象
function flattenObj(obj: any, prefix = ''): { key: string; value: string }[] {
  const result: { key: string; value: string }[] = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenObj(v, fullKey))
    } else {
      result.push({ key: fullKey, value: JSON.stringify(v) })
    }
  }
  return result
}

const flatConfig = computed(() => flattenObj(allConfig.value))
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Settings :size="22" /> 配置管理</h1>
      <p>多层嵌套配置、点号路径访问、环境切换、配置监听、导入导出</p>
    </div>

    <div class="card">
      <div class="card-title">当前环境</div>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button v-for="e in ['development', 'staging', 'production']" :key="e" class="btn" :class="{ 'btn-primary': env === e }" @click="switchEnv(e)">{{ e }}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">配置项</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <input v-model="newKey" class="input" placeholder="配置路径 (如 app.name)" style="width: 180px;" />
        <input v-model="newValue" class="input" placeholder="值 (JSON)" style="width: 200px;" />
        <button class="btn btn-primary" @click="setConfig"><Plus :size="14" /> 设置</button>
        <button class="btn btn-success" @click="exportJson"><Save :size="14" /> 导出 JSON</button>
        <button class="btn btn-danger" @click="resetConfig"><RotateCcw :size="14" /> 重置</button>
      </div>
      <div v-if="flatConfig.length">
        <div v-for="item in flatConfig" :key="item.key" style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--c-border);">
          <span class="badge badge-primary" style="font-family: monospace; min-width: 140px;">{{ item.key }}</span>
          <span class="code-block" style="flex: 1; padding: 4px 8px; font-size: 12px;">{{ item.value }}</span>
          <button class="btn btn-sm btn-danger" @click="deleteConfig(item.key)"><Trash2 :size="12" /></button>
        </div>
      </div>
      <div v-else class="empty-state">暂无配置</div>
    </div>

    <div class="card">
      <div class="card-title">变更日志</div>
      <div v-if="watchLogs.length" class="log-list">
        <div v-for="(l, i) in watchLogs" :key="i" class="log-item">
          <span class="badge badge-info">{{ l.key }}</span>
          <span style="font-size: 12px;">{{ l.value }}</span>
          <span class="log-time">{{ l.time }}</span>
        </div>
      </div>
      <div v-else class="empty-state">修改配置后此处显示变更通知</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>创建配置管理器</h4>
      <pre class="code-block">import { ConfigManagerImpl } from '@ldesign/engine-core'

const config = new ConfigManagerImpl({
  environment: 'development',
  defaults: {
    app: { name: 'My App', port: 3000 },
    db: { host: 'localhost', port: 5432 },
  },
  envPrefix: 'APP_',  // 自动加载 APP_* 环境变量
  loadEnv: true,
})</pre>

      <h4>点号路径读写</h4>
      <p>支持任意深度的嵌套路径，自动创建中间对象。</p>
      <pre class="code-block">config.set('app.name', 'New Name')
config.get('app.name')           // 'New Name'
config.get('app.port', 3000)     // 默认值
config.has('app.name')           // true
config.delete('app.name')        // true</pre>

      <h4>配置监听</h4>
      <pre class="code-block">// 监听特定键
const unwatch = config.watch('app.port', (value) =&gt; {
  console.log('Port changed:', value)
})

// 全局监听
config.watch((allConfig) =&gt; {
  console.log('Config changed:', allConfig)
})

unwatch() // 取消监听</pre>

      <h4>环境管理</h4>
      <pre class="code-block">config.getEnvironment()           // 'development'
config.setEnvironment('production') // 切换环境并重新加载</pre>

      <h4>配置源 &amp; 加载器</h4>
      <pre class="code-block">// 添加配置源（按优先级合并）
config.addSource({ name: 'remote', priority: 10, data: { ... } })

// 添加异步加载器
await config.addLoader({
  async load() { return fetch('/config.json').then(r =&gt; r.json()) },
  watch(onChange) { /* 轮询或 WebSocket */ }
})

// 重新加载
await config.reload()</pre>

      <h4>导入导出</h4>
      <pre class="code-block">const json = config.export('json')  // JSON 字符串
const env = config.export('env')    // KEY=VALUE 格式
config.setAll(JSON.parse(json))     // 批量导入</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>多环境配置</strong><span>dev/staging/prod 不同配置自动切换，无需修改代码。</span></div>
        <div class="scenario"><strong>远程配置中心</strong><span>通过 Loader 从远端拉取配置，支持热更新。</span></div>
        <div class="scenario"><strong>功能开关</strong><span>通过配置控制 Feature Flag，无需重新部署。</span></div>
        <div class="scenario"><strong>插件配置</strong><span>每个插件读取自己的命名空间配置，互不干扰。</span></div>
      </div>
    </div>
  </div>
</template>
