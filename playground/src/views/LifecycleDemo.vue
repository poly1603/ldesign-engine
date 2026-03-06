<script setup lang="ts">
import { ref, computed } from 'vue'
import { RotateCcw, Play, Trash2, Clock, BookOpen, Lightbulb } from 'lucide-vue-next'
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()
const logs = ref<{ hook: string; time: string; count: number }[]>([])

const hooks = [
  'beforeInit', 'init', 'afterInit',
  'beforeMount', 'mounted',
  'beforeUpdate', 'updated',
  'beforeUnmount', 'unmounted',
] as const

const hookStats = computed(() =>
  hooks.map(h => ({
    name: h,
    count: engine.lifecycle.getTriggerCount(h),
    handlers: engine.lifecycle.getHandlerCount(h),
  }))
)

function triggerHook(hook: string) {
  engine.lifecycle.trigger(hook as any).then(() => {
    logs.value = [...logs.value, {
      hook,
      time: new Date().toLocaleTimeString(),
      count: engine.lifecycle.getTriggerCount(hook as any),
    }]
  })
}

function registerOnceHook(hook: string) {
  engine.lifecycle.once(hook as any, () => {
    logs.value = [...logs.value, {
      hook: `${hook} (once fired)`,
      time: new Date().toLocaleTimeString(),
      count: engine.lifecycle.getTriggerCount(hook as any),
    }]
  })
  logs.value = [...logs.value, {
    hook: `Registered once → "${hook}"`,
    time: new Date().toLocaleTimeString(),
    count: 0,
  }]
}
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><RotateCcw :size="22" /> 生命周期系统</h1>
      <p>引擎生命周期钩子注册、触发与一次性监听</p>
    </div>

    <div class="card">
      <div class="card-title">钩子概览</div>
      <div class="hook-grid">
        <div v-for="stat in hookStats" :key="stat.name" class="hook-cell">
          <div class="hook-name">{{ stat.name }}</div>
          <div style="font-size: 12px; color: var(--c-text-3); margin: 4px 0;">
            触发 {{ stat.count }} 次 · {{ stat.handlers }} 个处理器
          </div>
          <div class="btn-group" style="margin-top: 6px;">
            <button class="btn btn-sm btn-primary" @click="triggerHook(stat.name)"><Play :size="12" /> 触发</button>
            <button class="btn btn-sm" @click="registerOnceHook(stat.name)"><Clock :size="12" /> Once</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>触发日志</span>
        <button class="btn btn-sm" @click="logs = []"><Trash2 :size="12" /> 清空</button>
      </div>
      <div v-if="logs.length" class="log-list">
        <div v-for="(log, i) in logs" :key="i" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="badge badge-primary">{{ log.hook }}</span>
          <span v-if="log.count" style="font-size: 12px; color: var(--c-text-3);">累计 {{ log.count }} 次</span>
        </div>
      </div>
      <div v-else class="empty-state">点击上方按钮触发生命周期钩子</div>
    </div>

    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>
    <div class="card doc-section">
      <h4>注册钩子</h4>
      <p>使用 <code>on</code> 注册持久钩子，<code>once</code> 注册一次性钩子（触发后自动移除）。</p>
      <pre class="code-block">// 持久钩子
engine.lifecycle.on('mounted', async () =&gt; {
  console.log('应用已挂载')
  await loadInitialData()
})

// 一次性钩子
engine.lifecycle.once('init', () =&gt; {
  console.log('仅在初始化时执行一次')
})</pre>

      <h4>触发钩子</h4>
      <p>调用 <code>trigger</code> 触发指定钩子，所有处理器并行执行，错误隔离（单个失败不影响其他）。</p>
      <pre class="code-block">await engine.lifecycle.trigger('mounted')
await engine.lifecycle.trigger('beforeUpdate', oldData, newData)</pre>

      <h4>查询与管理</h4>
      <pre class="code-block">engine.lifecycle.getHandlerCount('mounted')  // 处理器数量
engine.lifecycle.getTriggerCount('mounted')  // 触发次数
engine.lifecycle.getHookNames()              // 所有钩子名称
engine.lifecycle.off('mounted', handler)     // 移除特定处理器
engine.lifecycle.off('mounted')              // 移除所有处理器
engine.lifecycle.clear()                     // 清空所有钩子</pre>

      <h4>生命周期顺序</h4>
      <pre class="code-block">beforeInit → init → afterInit → beforeMount → mounted
beforeUpdate → updated  (可多次触发)
beforeUnmount → unmounted → beforeDestroy → destroyed</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>初始化流程</strong><span>在 beforeInit/init 中加载配置、连接数据库、初始化第三方 SDK。</span></div>
        <div class="scenario"><strong>资源清理</strong><span>在 beforeUnmount/unmounted 中断开 WebSocket、取消定时器、释放内存。</span></div>
        <div class="scenario"><strong>插件协调</strong><span>插件在特定生命周期阶段执行逻辑，如 mounted 时注册全局组件或初始化 UI。</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hook-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.hook-cell { padding: 12px; border: 1px solid var(--c-border); border-radius: 6px; background: var(--c-bg); }
.hook-name { font-weight: 600; font-size: 13px; font-family: monospace; }
</style>
