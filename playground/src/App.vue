<script setup lang="ts">
import { ref } from 'vue'
import {
  Blocks, Layers, RotateCcw, Radio, Database,
  Box, Activity, ShieldAlert, Settings,
} from 'lucide-vue-next'
import PluginDemo from './views/PluginDemo.vue'
import MiddlewareDemo from './views/MiddlewareDemo.vue'
import LifecycleDemo from './views/LifecycleDemo.vue'
import EventDemo from './views/EventDemo.vue'
import StateDemo from './views/StateDemo.vue'
import ContainerDemo from './views/ContainerDemo.vue'
import PerformanceDemo from './views/PerformanceDemo.vue'
import ErrorDemo from './views/ErrorDemo.vue'
import ConfigDemo from './views/ConfigDemo.vue'

const currentView = ref('plugin')

const views = [
  { key: 'plugin', label: '插件系统', icon: Blocks },
  { key: 'middleware', label: '中间件', icon: Layers },
  { key: 'lifecycle', label: '生命周期', icon: RotateCcw },
  { key: 'event', label: '事件系统', icon: Radio },
  { key: 'state', label: '状态管理', icon: Database },
  { key: 'container', label: '服务容器', icon: Box },
  { key: 'performance', label: '性能监控', icon: Activity },
  { key: 'error', label: '错误边界', icon: ShieldAlert },
  { key: 'config', label: '配置管理', icon: Settings },
]
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">LD</div>
        <div class="logo-text">
          <span class="logo-title">Engine</span>
          <span class="logo-sub">Playground</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="view in views"
          :key="view.key"
          :class="['nav-item', { active: currentView === view.key }]"
          @click="currentView = view.key"
        >
          <component :is="view.icon" :size="18" />
          <span>{{ view.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <span class="version">v0.3.0</span>
      </div>
    </aside>
    <main class="content">
      <PluginDemo v-if="currentView === 'plugin'" />
      <MiddlewareDemo v-else-if="currentView === 'middleware'" />
      <LifecycleDemo v-else-if="currentView === 'lifecycle'" />
      <EventDemo v-else-if="currentView === 'event'" />
      <StateDemo v-else-if="currentView === 'state'" />
      <ContainerDemo v-else-if="currentView === 'container'" />
      <PerformanceDemo v-else-if="currentView === 'performance'" />
      <ErrorDemo v-else-if="currentView === 'error'" />
      <ConfigDemo v-else-if="currentView === 'config'" />
    </main>
  </div>
</template>

<style>
:root {
  --c-primary: #4f46e5;
  --c-primary-light: #818cf8;
  --c-primary-bg: #eef2ff;
  --c-success: #10b981;
  --c-success-bg: #ecfdf5;
  --c-warning: #f59e0b;
  --c-warning-bg: #fffbeb;
  --c-danger: #ef4444;
  --c-danger-bg: #fef2f2;
  --c-text: #1e293b;
  --c-text-2: #64748b;
  --c-text-3: #94a3b8;
  --c-border: #e2e8f0;
  --c-bg: #f8fafc;
  --c-card: #ffffff;
  --radius: 8px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; color: var(--c-text); background: var(--c-bg); line-height: 1.6; }
.app { display: flex; min-height: 100vh; }
.sidebar { width: 220px; background: var(--c-card); border-right: 1px solid var(--c-border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; }
.sidebar-header { padding: 20px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--c-border); }
.logo { width: 36px; height: 36px; background: var(--c-primary); color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.logo-text { display: flex; flex-direction: column; line-height: 1.2; }
.logo-title { font-weight: 700; font-size: 15px; }
.logo-sub { font-size: 11px; color: var(--c-text-3); }
.sidebar-nav { flex: 1; padding: 8px; overflow-y: auto; }
.nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border: none; border-radius: 6px; background: transparent; color: var(--c-text-2); font-size: 13.5px; cursor: pointer; transition: all .15s; text-align: left; }
.nav-item:hover { background: var(--c-bg); color: var(--c-text); }
.nav-item.active { background: var(--c-primary-bg); color: var(--c-primary); font-weight: 600; }
.sidebar-footer { padding: 12px 16px; border-top: 1px solid var(--c-border); }
.version { font-size: 11px; color: var(--c-text-3); }
.content { flex: 1; margin-left: 220px; padding: 28px 32px; }
.demo-header { margin-bottom: 24px; }
.demo-header h1 { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.demo-header p { color: var(--c-text-2); font-size: 14px; margin-top: 4px; }
.card { background: var(--c-card); border: 1px solid var(--c-border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1px solid var(--c-border); border-radius: 6px; background: var(--c-card); color: var(--c-text); font-size: 13px; cursor: pointer; transition: all .15s; white-space: nowrap; }
.btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-primary { background: var(--c-primary); color: #fff; border-color: var(--c-primary); }
.btn-primary:hover { background: var(--c-primary-light); border-color: var(--c-primary-light); color: #fff; }
.btn-danger { background: var(--c-danger); color: #fff; border-color: var(--c-danger); }
.btn-danger:hover { opacity: .85; color: #fff; }
.btn-success { background: var(--c-success); color: #fff; border-color: var(--c-success); }
.btn-success:hover { opacity: .85; color: #fff; }
.btn-warning { background: var(--c-warning); color: #fff; border-color: var(--c-warning); }
.btn-warning:hover { opacity: .85; color: #fff; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-group { display: flex; gap: 8px; flex-wrap: wrap; }
.input { padding: 7px 12px; border: 1px solid var(--c-border); border-radius: 6px; font-size: 13px; color: var(--c-text); outline: none; transition: border-color .15s; background: #fff; }
.input:focus { border-color: var(--c-primary); }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.badge-primary { background: var(--c-primary-bg); color: var(--c-primary); }
.badge-success { background: var(--c-success-bg); color: var(--c-success); }
.badge-warning { background: var(--c-warning-bg); color: var(--c-warning); }
.badge-danger { background: var(--c-danger-bg); color: var(--c-danger); }
.badge-info { background: #e0f2fe; color: #0284c7; }
.code-block { background: #f1f5f9; border-radius: 6px; padding: 12px 16px; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12.5px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.stat-card { padding: 16px; border-radius: var(--radius); text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; }
.stat-label { font-size: 12px; color: var(--c-text-2); margin-top: 2px; }
.log-list { max-height: 320px; overflow-y: auto; }
.log-item { display: flex; align-items: baseline; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--c-border); font-size: 13px; }
.log-time { color: var(--c-text-3); font-size: 12px; white-space: nowrap; }
.log-content { color: var(--c-text-2); word-break: break-all; }
.empty-state { text-align: center; padding: 32px 0; color: var(--c-text-3); font-size: 13px; }
.doc-section h4 { font-size: 14px; font-weight: 600; margin: 16px 0 6px; color: var(--c-text); }
.doc-section h4:first-of-type { margin-top: 4px; }
.doc-section p { font-size: 13px; color: var(--c-text-2); line-height: 1.6; margin-bottom: 8px; }
.doc-section code { background: var(--c-primary-bg); color: var(--c-primary); padding: 1px 5px; border-radius: 3px; font-size: 12px; }
.doc-section .code-block { font-size: 12px; margin-bottom: 12px; }
.scenario-list { display: flex; flex-direction: column; gap: 10px; }
.scenario { padding: 10px 14px; background: var(--c-bg); border-radius: 6px; border-left: 3px solid var(--c-primary); }
.scenario strong { display: block; font-size: 13px; margin-bottom: 2px; }
.scenario span { font-size: 12.5px; color: var(--c-text-2); line-height: 1.5; }
.section-divider { margin: 24px 0 8px; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--c-text); }
</style>
