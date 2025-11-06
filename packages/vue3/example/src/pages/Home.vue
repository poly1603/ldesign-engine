<template>
  <div class="page">
    <h2>🏠 首页</h2>
    <p>欢迎使用 Vue 3 + LDesign Engine + Router 示例应用！</p>

    <div class="card">
      <h3>计数器演示</h3>
      <div class="counter">
        <button @click="decrement">-</button>
        <span class="count">{{ count }}</span>
        <button @click="increment">+</button>
      </div>
      <p class="hint">这个计数器使用 Engine 的状态管理</p>
    </div>

    <div class="card">
      <h3>✨ 特性</h3>
      <ul>
        <li>🚀 Vue 3 支持</li>
        <li>🔧 强大的插件系统</li>
        <li>🎯 完整的 TypeScript 支持</li>
        <li>🛣️ 集成路由管理</li>
        <li>📦 状态管理</li>
        <li>🎪 事件系统</li>
      </ul>
    </div>

    <div class="card">
      <h3>🧭 导航</h3>
      <p>使用顶部导航栏访问不同页面：</p>
      <ul>
        <li><strong>首页</strong> - 当前页面</li>
        <li><strong>关于</strong> - 了解更多信息</li>
        <li><strong>用户</strong> - 查看用户详情（带参数）</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEngine, useState } from '@ldesign/engine-vue3'

const engine = useEngine()
const count = ref(useState('count', 0))
const logCount = ref(0)

// 添加日志输出用于测试
onMounted(() => {
  console.log('📄 Home.vue mounted - 首页组件已挂载')
  console.log('🔢 当前计数:', count.value)
  
  // 定期输出日志测试实时日志功能
  const interval = setInterval(() => {
    logCount.value++
    console.log(`📊 Home.vue 日志 #${logCount.value} - 测试实时日志输出 - ${new Date().toLocaleTimeString()}`)
    console.log(`🔢 当前计数状态: ${count.value}`)
  }, 3000) // 每3秒输出一次日志
  
  // 清理定时器
  onUnmounted(() => {
    clearInterval(interval)
    console.log('🛑 Home.vue 定时器已清理')
  })
})

const increment = () => {
  const newCount = count.value + 1
  engine.state.set('count', newCount)
  console.log(`➕ 计数增加: ${count.value} -> ${newCount}`)
}

const decrement = () => {
  const newCount = Math.max(0, count.value - 1)
  engine.state.set('count', newCount)
  console.log(`➖ 计数减少: ${count.value} -> ${newCount}`)
}
</script>

