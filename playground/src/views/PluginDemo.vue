<script setup lang="ts">
import { ref, computed } from 'vue'
import { Blocks, Plus, Minus, RotateCcw, List, BookOpen, Lightbulb } from 'lucide-vue-next'
import { useEngine, useEngineState, useEngineEvent } from '@ldesign/engine-vue3'

const engine = useEngine()
const [count] = useEngineState<number>('counter:value', 0)
const [history] = useEngineState<number[]>('counter:history', [])
const lastAction = ref('')
const counterApi = (engine.api as any).get('counter') as any
const greetingApi = (engine.api as any).get('greeting') as any
const [greetMsg] = useEngineState<string>('greeting:message', '')
const [greetLogs] = useEngineState<string[]>('greeting:logs', [])

const historyList = computed(() => history.value)
const greetLogsList = computed(() => greetLogs.value)

const pluginList = computed(() => engine.plugins.getAll().map(p => ({ name: p.name, version: p.version })))
const apiList = computed(() => engine.api.getAllNames())

useEngineEvent('counter:changed', (payload: any) => {
  lastAction.value = `${payload.action} → ${payload.value}`
})
</script>

<template>
  <div>
    <div class="demo-header">
      <h1><Blocks :size="22" /> 插件系统</h1>
      <p>展示 definePlugin、PluginAPI 注册与调用、插件间通信</p>
    </div>

    <div class="card">
      <div class="card-title">已安装插件</div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <span v-for="p in pluginList" :key="p.name" class="badge badge-primary">
          {{ p.name }} <span style="opacity: .6;">v{{ p.version }}</span>
        </span>
      </div>
      <div style="margin-top: 12px; font-size: 13px; color: var(--c-text-2);">
        已注册 API: <span v-for="(name, i) in apiList" :key="name"><span v-if="i > 0">, </span><code style="background: var(--c-primary-bg); color: var(--c-primary); padding: 1px 5px; border-radius: 3px; font-size: 12px;">{{ name }}</code></span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Counter 插件</div>
      <div style="text-align: center; margin: 16px 0;">
        <div class="stat-value" style="color: var(--c-primary); font-size: 48px;">{{ count }}</div>
        <div class="btn-group" style="justify-content: center; margin-top: 16px;">
          <button class="btn btn-primary" @click="counterApi?.increment()"><Plus :size="16" /> 增加</button>
          <button class="btn btn-danger" @click="counterApi?.decrement()"><Minus :size="16" /> 减少</button>
          <button class="btn" @click="counterApi?.reset()"><RotateCcw :size="16" /> 重置</button>
        </div>
      </div>
      <div v-if="lastAction" style="font-size: 13px; margin-bottom: 8px;">最近: <span class="badge badge-primary">{{ lastAction }}</span></div>
      <div v-if="historyList.length"><div class="code-block" style="font-size: 12px;">{{ historyList.join(' → ') }}</div></div>
    </div>

    <div class="card">
      <div class="card-title">Greeting 插件</div>
      <div class="btn-group" style="margin-bottom: 12px;">
        <button class="btn btn-primary" @click="greetingApi?.greet()">打招呼</button>
        <button class="btn" @click="greetingApi?.greet('LDesign')">向 LDesign 打招呼</button>
        <button class="btn" @click="greetingApi?.setLocale('en')">English</button>
        <button class="btn" @click="greetingApi?.setLocale('zh')">中文</button>
      </div>
      <div v-if="greetMsg" class="code-block" style="margin-bottom: 10px;">{{ greetMsg }}</div>
      <div v-if="greetLogsList.length" class="log-list" style="max-height: 140px;">
        <div v-for="(log, i) in greetLogsList" :key="i">
          <span class="log-time">{{ String(i + 1).padStart(2, '0') }}</span>
          <span style="font-size: 12px; font-family: monospace;">{{ log }}</span>
        </div>
      </div>
    </div>

    <!-- 使用指南 -->
    <div class="section-divider"><BookOpen :size="18" /> 使用指南</div>

    <div class="card doc-section">
      <h4>定义插件</h4>
      <p>使用 <code>definePlugin</code> 创建类型安全的插件，通过 <code>install</code> 钩子访问引擎上下文（engine、container）。</p>
      <pre class="code-block">import { definePlugin } from '@ldesign/engine-core'

export const myPlugin = definePlugin&lt;MyOptions&gt;({
  name: 'my-plugin',
  version: '1.0.0',

  install(context, options) {
    const { engine, container } = context
    // 注册状态
    engine.state.set('my:data', options?.initialData)
    // 注册 API（name、version 必填）
    engine.api.register({
      name: 'my-plugin', version: '1.0.0',
      doSomething() { /* ... */ },
    })
  },

  uninstall(context) {
    context.engine.state.delete('my:data')
  },
})</pre>

      <h4>注册插件</h4>
      <p>在创建引擎时传入 <code>plugins</code> 数组，或运行时动态安装。</p>
      <pre class="code-block">// 声明式注册
const engine = createVueEngine({
  plugins: [myPlugin, anotherPlugin],
})

// 动态注册（传入选项）
await engine.use(myPlugin, { initialData: 'hello' })</pre>

      <h4>插件间通信</h4>
      <p>通过 <code>engine.api.register()</code> 注册、<code>engine.api.get()</code> 调用其他插件暴露的方法。</p>
      <pre class="code-block">// 插件 A
engine.api.register({ name: 'auth', version: '1.0.0', getUser() { ... } })

// 插件 B
const user = engine.api.get('auth')?.getUser()</pre>
    </div>

    <div class="section-divider"><Lightbulb :size="18" /> 适用场景</div>
    <div class="card">
      <div class="scenario-list">
        <div class="scenario"><strong>模块化架构</strong><span>将大型应用拆分为独立插件，各自管理状态、事件和 API，引擎统一协调。</span></div>
        <div class="scenario"><strong>第三方扩展</strong><span>提供插件接口给第三方开发者，如自定义主题、数据源、认证等扩展。</span></div>
        <div class="scenario"><strong>按需加载</strong><span>配合 LazyPluginLoader 实现插件懒加载，按需安装减少首屏体积。</span></div>
        <div class="scenario"><strong>可测试性</strong><span>插件独立安装/卸载，mock 引擎上下文即可进行单元测试。</span></div>
      </div>
    </div>
  </div>
</template>
