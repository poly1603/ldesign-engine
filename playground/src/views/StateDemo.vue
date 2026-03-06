<script setup lang="ts">
import { ref } from 'vue'
import { Database, Plus, Trash2, Undo2, Redo2, Save, RotateCcw, BookOpen, Lightbulb } from 'lucide-vue-next'
import { useEngine } from '@ldesign/engine-vue3'
import { TimeTravelStateManager } from '@ldesign/engine-core'

const engine = useEngine()
const newKey = ref('color')
const newValue = ref('"blue"')
const stateKeys = ref<string[]>(engine.state.keys())

function refreshKeys() { stateKeys.value = engine.state.keys() }
function setState() {
  const k = newKey.value.trim(); if (!k) return
  let val: any = newValue.value
  try { val = JSON.parse(newValue.value) } catch {}
  engine.state.set(k, val); refreshKeys()
}
function deleteState(key: string) { engine.state.delete(key); refreshKeys() }
function getDisplay(key: string) {
  const v = engine.state.get(key)
  return typeof v === 'object' ? JSON.stringify(v) : String(v ?? 'undefined')
}

// 时间旅行
const ttm = new TimeTravelStateManager({ maxHistory: 30 })
const ttCounter = ref(0)
const ttSnapshots = ref<any[]>(ttm.getSnapshots())
const ttStats = ref<any>(ttm.getTimeTravelStats())

/** 手动刷新 ttm 的快照/统计（ttm 非响应式对象，computed 无法追踪） */
function refreshTT() {
  ttSnapshots.value = ttm.getSnapshots()
  ttStats.value = ttm.getTimeTravelStats()
}

function ttIncrement() { ttCounter.value++; ttm.set('counter', ttCounter.value); refreshTT() }
function ttDecrement() { ttCounter.value--; ttm.set('counter', ttCounter.value); refreshTT() }
function ttUndo() { if (ttm.undo()) ttCounter.value = ttm.get<number>('counter') ?? 0; refreshTT() }
function ttRedo() { if (ttm.redo()) ttCounter.value = ttm.get<number>('counter') ?? 0; refreshTT() }
function ttSaveSnapshot() { ttm.snapshot(`手动保存 #${ttSnapshots.value.length}`); refreshTT() }
function ttGoTo(id: string) { if (ttm.goToSnapshot(id)) ttCounter.value = ttm.get<number>('counter') ?? 0; refreshTT() }
function ttReset() { ttm.clearHistory(false); ttCounter.value = 0; ttm.set('counter', 0); refreshTT() }
ttm.set('counter', 0)
refreshTT()
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Database :size="22" /> 状态管理</h1>
      <p>状态 CRUD、watch 监听、批量更新、时间旅行（撤销/重做/快照）</p>
    </div>

    <div class="card">
      <div class="card-title">引擎全局状态</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <input v-model="newKey" class="input" placeholder="Key" style="width: 120px;" />
        <input v-model="newValue" class="input" placeholder="Value (JSON)" style="width: 180px;" />
        <button class="btn btn-primary" @click="setState"><Plus :size="14" /> 设置</button>
        <button class="btn" @click="refreshKeys"><RotateCcw :size="14" /> 刷新</button>
      </div>
      <div v-if="stateKeys.length">
        <div v-for="key in stateKeys" :key="key" style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--c-border);">
          <span class="badge badge-primary" style="font-family: monospace;">{{ key }}</span>
          <span class="code-block" style="flex: 1; padding: 4px 8px; font-size: 12px;">{{ getDisplay(key) }}</span>
          <button class="btn btn-sm btn-danger" @click="deleteState(key)"><Trash2 :size="12" /></button>
        </div>
      </div>
      <div v-else class="empty-state">暂无状态数据</div>
    </div>

    <div class="card">
      <div class="card-title">时间旅行</div>
      <div class="stat-grid" style="margin-bottom: 16px;">
        <div class="stat-card" style="background: var(--c-primary-bg);"><div class="stat-value" style="color: var(--c-primary);">{{ ttCounter }}</div><div class="stat-label">计数器</div></div>
        <div class="stat-card" style="background: var(--c-success-bg);"><div class="stat-value" style="color: var(--c-success);">{{ ttStats.totalSnapshots }}</div><div class="stat-label">快照数</div></div>
        <div class="stat-card" style="background: var(--c-warning-bg);"><div class="stat-value" style="color: var(--c-warning);">{{ ttStats.currentIndex }}</div><div class="stat-label">当前位置</div></div>
      </div>
      <div class="btn-group">
        <button class="btn" @click="ttDecrement">- 1</button>
        <button class="btn btn-primary" @click="ttIncrement">+ 1</button>
        <button class="btn" :disabled="!ttStats.canUndo" @click="ttUndo"><Undo2 :size="14" /> 撤销</button>
        <button class="btn" :disabled="!ttStats.canRedo" @click="ttRedo"><Redo2 :size="14" /> 重做</button>
        <button class="btn btn-success" @click="ttSaveSnapshot"><Save :size="14" /> 保存快照</button>
        <button class="btn btn-danger" @click="ttReset"><Trash2 :size="14" /> 重置</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">快照列表</div>
      <div v-if="ttSnapshots.length" class="log-list">
        <div v-for="(snap, i) in ttSnapshots" :key="snap.id" class="log-item" :style="{ background: i === ttStats.currentIndex ? 'var(--c-primary-bg)' : '' }" style="cursor: pointer; padding: 6px 8px; border-radius: 4px;" @click="ttGoTo(snap.id)">
          <span class="badge" :class="i === ttStats.currentIndex ? 'badge-primary' : 'badge-success'">#{{ i }}</span>
          <span style="font-size: 12px; color: var(--c-text-2);">{{ snap.description }} · counter={{ snap.state.counter ?? '?' }}</span>
          <span class="log-time">{{ new Date(snap.timestamp).toLocaleTimeString() }}</span>
        </div>
      </div>
      <div v-else class="empty-state">暂无快照</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>基础 CRUD</h4>
      <pre class="code-block">engine.state.set('user', { name: 'Alice', age: 25 })
const user = engine.state.get&lt;User&gt;('user')
engine.state.has('user')     // true
engine.state.delete('user')
engine.state.keys()          // 所有键
engine.state.getAll()        // 所有状态快照</pre>

      <h4>状态监听</h4>
      <p>使用 <code>watch</code> 监听状态变化，返回取消函数。支持深度比较，值未变不触发。</p>
      <pre class="code-block">const unwatch = engine.state.watch('user', (newVal, oldVal) =&gt; {
  console.log('User changed:', newVal)
})
unwatch()  // 取消监听</pre>

      <h4>批量更新</h4>
      <p>使用 <code>batch</code> 合并多次更新，仅在批量结束后统一触发监听器。</p>
      <pre class="code-block">engine.state.batch(() =&gt; {
  engine.state.set('a', 1)
  engine.state.set('b', 2)
  engine.state.set('c', 3)
}) // 仅触发一次监听器</pre>

      <h4>时间旅行</h4>
      <pre class="code-block">import { TimeTravelStateManager } from '@ldesign/engine-core'

const state = new TimeTravelStateManager({ maxHistory: 50 })
state.set('count', 1)
state.set('count', 2)
state.undo()               // count = 1
state.redo()               // count = 2
state.snapshot('保存点')    // 创建命名快照
state.goToSnapshot(id)     // 跳转到快照</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>全局共享状态</strong><span>跨组件/插件共享数据，如用户信息、主题配置、权限列表。</span></div>
        <div class="scenario"><strong>编辑器撤销/重做</strong><span>TimeTravelStateManager 提供完整的撤销/重做能力，适合富文本、图形编辑器。</span></div>
        <div class="scenario"><strong>状态持久化</strong><span>toJSON/fromJSON 支持序列化到 localStorage 或 IndexedDB。</span></div>
        <div class="scenario"><strong>性能优化</strong><span>batch 批量更新减少渲染次数，setShallow 浅比较优化大对象。</span></div>
      </div>
    </div>
  </div>
</template>
