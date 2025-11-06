<template>
  <div class="page">
    <h2>ℹ️ 关于</h2>
    <p>这是一个展示 LDesign Engine 功能的示例应用。</p>

    <div class="card">
      <h3>🏗️ 架构</h3>
      <p>LDesign Engine 采用插件化架构，提供以下核心功能：</p>
      <ul>
        <li><strong>插件系统</strong> - 可扩展的插件机制</li>
        <li><strong>中间件</strong> - 灵活的中间件管道</li>
        <li><strong>状态管理</strong> - 响应式状态管理</li>
        <li><strong>事件系统</strong> - 发布/订阅事件机制</li>
        <li><strong>生命周期</strong> - 完整的生命周期钩子</li>
        <li><strong>路由管理</strong> - 集成的路由系统</li>
      </ul>
    </div>

    <div class="card">
      <h3>🎪 事件系统演示</h3>
      <button @click="handleTestEvent" class="btn-primary">
        触发测试事件
      </button>
      <p class="hint">打开控制台查看事件日志</p>
    </div>

    <div class="card">
      <h3>📚 引擎信息</h3>
      <table class="info-table">
        <tbody>
          <tr>
            <td><strong>引擎名称:</strong></td>
            <td>{{ engine.config.name }}</td>
          </tr>
          <tr>
            <td><strong>调试模式:</strong></td>
            <td>{{ engine.config.debug ? '✅ 开启' : '❌ 关闭' }}</td>
          </tr>
          <tr>
            <td><strong>已加载插件:</strong></td>
            <td>{{ engine.plugins.getAll().length }} 个</td>
          </tr>
          <tr>
            <td><strong>中间件数量:</strong></td>
            <td>{{ engine.middleware.getAll().length }} 个</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>🔗 相关链接</h3>
      <ul>
        <li><a href="https://github.com/ldesign" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href="https://ldesign.dev" target="_blank" rel="noopener noreferrer">官方网站</a></li>
        <li><a href="https://ldesign.dev/docs" target="_blank" rel="noopener noreferrer">文档</a></li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()

const handleTestEvent = () => {
  engine.events.emit('test:event', { message: '这是一个测试事件！', timestamp: Date.now() })
}
</script>

