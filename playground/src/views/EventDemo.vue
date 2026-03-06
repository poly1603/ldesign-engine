<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Radio, Send, Trash2, Plus, Filter, BookOpen, Lightbulb } from 'lucide-vue-next'
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()
const eventName = ref('demo:greet')
const eventPayload = ref('Hello World')
const eventLog = ref<{ event: string; payload: string; time: string }[]>([])
const activeListeners = ref<{ event: string; unsub: () => void }[]>([])
const listenEvent = ref('demo:greet')

function subscribe() {
  const ev = listenEvent.value.trim()
  if (!ev) return
  const unsub = engine.events.on(ev, (payload: any) => {
    eventLog.value = [...eventLog.value, {
      event: ev,
      payload: typeof payload === 'object' ? JSON.stringify(payload) : String(payload ?? ''),
      time: new Date().toLocaleTimeString(),
    }]
  })
  activeListeners.value = [...activeListeners.value, { event: ev, unsub }]
}

function unsubscribe(index: number) {
  activeListeners.value[index]?.unsub()
  activeListeners.value = activeListeners.value.filter((_, i) => i !== index)
}

function emitEvent() {
  const ev = eventName.value.trim()
  if (!ev) return
  let payload: any = eventPayload.value
  try { payload = JSON.parse(eventPayload.value) } catch {}
  engine.events.emit(ev, payload)
}

const nsLog = ref<string[]>([])
const nsUnsubs: (() => void)[] = []

function setupNamespaces() {
  nsLog.value = []
  nsUnsubs.forEach(u => u()); nsUnsubs.length = 0

  nsUnsubs.push(engine.events.on('module-a:action', () => {
    nsLog.value = [...nsLog.value, '[module-a] 收到 action 事件']
  }))
  nsUnsubs.push(engine.events.on('module-b:action', () => {
    nsLog.value = [...nsLog.value, '[module-b] 收到 action 事件']
  }))
  nsUnsubs.push(engine.events.on('module-a:*', () => {
    nsLog.value = [...nsLog.value, '[module-a:*] 通配符匹配命中']
  }))
  nsLog.value = ['已注册: module-a:action, module-b:action, module-a:* 监听器']
}

function emitNs(ns: string) {
  engine.events.emit(`${ns}:action`, { from: ns })
}

onUnmounted(() => {
  activeListeners.value.forEach(l => l.unsub())
  nsUnsubs.forEach(u => u())
})
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Radio :size="22" /> 事件系统</h1>
      <p>发布/订阅模式、通配符监听、命名空间隔离、优先级</p>
    </div>

    <div class="card">
      <div class="card-title">发布 & 订阅</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <input v-model="listenEvent" class="input" placeholder="监听事件名 (支持 *)" style="width: 200px;" />
        <button class="btn btn-success" @click="subscribe"><Plus :size="14" /> 订阅</button>
      </div>
      <div v-if="activeListeners.length" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
        <span v-for="(l, i) in activeListeners" :key="i" class="badge badge-primary" style="cursor: pointer;" @click="unsubscribe(i)">{{ l.event }} ×</span>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <input v-model="eventName" class="input" placeholder="事件名" style="width: 160px;" />
        <input v-model="eventPayload" class="input" placeholder="Payload" style="width: 180px;" />
        <button class="btn btn-primary" @click="emitEvent"><Send :size="14" /> 发布</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>事件日志</span>
        <button class="btn btn-sm" @click="eventLog = []"><Trash2 :size="12" /> 清空</button>
      </div>
      <div v-if="eventLog.length" class="log-list">
        <div v-for="(log, i) in eventLog" :key="i" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="badge badge-success">{{ log.event }}</span>
          <span class="log-content">{{ log.payload }}</span>
        </div>
      </div>
      <div v-else class="empty-state">先订阅事件，再发布事件查看日志</div>
    </div>

    <div class="card">
      <div class="card-title"><Filter :size="14" /> 命名空间隔离</div>
      <div class="btn-group" style="margin-bottom: 12px;">
        <button class="btn btn-primary" @click="setupNamespaces">初始化命名空间</button>
        <button class="btn" @click="emitNs('module-a')">触发 module-a:action</button>
        <button class="btn" @click="emitNs('module-b')">触发 module-b:action</button>
      </div>
      <div v-if="nsLog.length" class="log-list">
        <div v-for="(log, i) in nsLog" :key="i" class="log-item">
          <span class="log-time">{{ String(i + 1).padStart(2, '0') }}</span>
          <span style="font-size: 13px; font-family: monospace;">{{ log }}</span>
        </div>
      </div>
      <div v-else class="empty-state">点击"初始化命名空间"开始</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>基础用法</h4>
      <p>使用 <code>on</code> 订阅、<code>emit</code> 发布、<code>once</code> 一次性监听。返回的函数可取消订阅。</p>
      <pre class="code-block">// 订阅事件
const unsub = engine.events.on('user:login', (user) =&gt; {
  console.log('用户登录:', user)
})

// 发布事件
engine.events.emit('user:login', { id: 1, name: 'Alice' })

// 一次性监听
engine.events.once('app:ready', () =&gt; { /* 只执行一次 */ })

// 取消订阅
unsub()</pre>

      <h4>通配符与优先级</h4>
      <p><code>*</code> 匹配同一层级，<code>**</code> 匹配任意层级。优先级越大越先执行。</p>
      <pre class="code-block">engine.events.on('user:*', handler)        // 匹配 user:login, user:logout
engine.events.on('**', handler)            // 匹配所有事件
engine.events.on('msg', handler, 100)      // 优先级 100（先执行）</pre>

      <h4>高级特性</h4>
      <pre class="code-block">// 异步事件（等待所有处理器完成）
await engine.events.emitAsync('data:save', data)

// 节流监听（100ms 内最多触发一次）
engine.events.onThrottled('scroll', handler, { delay: 100 })

// 防抖监听（停止 300ms 后才触发）
engine.events.onDebounced('input', handler, 300)

// 批量触发
engine.events.emitBatch([
  { event: 'log', payload: 'a' },
  { event: 'log', payload: 'b' },
])</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>组件解耦</strong><span>不同模块通过事件通信，无需直接引用，降低耦合度。</span></div>
        <div class="scenario"><strong>实时通知</strong><span>WebSocket 消息到达时 emit 事件，UI 组件自动响应更新。</span></div>
        <div class="scenario"><strong>分析追踪</strong><span>通配符监听 analytics:* 事件，统一收集用户行为数据。</span></div>
        <div class="scenario"><strong>跨插件通信</strong><span>插件 A emit 事件，插件 B 监听响应，无需知道彼此实现细节。</span></div>
      </div>
    </div>
  </div>
</template>
