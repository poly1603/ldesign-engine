<template>
  <div id="app" class="app">
    <header class="header">
      <h1>🚀 Vue 3 + LDesign Engine + Router</h1>
      <p>这是一个使用 @ldesign/engine-vue3 和路由系统构建的示例项目 - 实时日志测试版本 {{ version }}</p>
    </header>

    <!-- 导航栏 -->
    <Navigation />

    <main class="main">
      <!-- 路由视图 -->
      <RouterView :routes="routes" />
    </main>

    <footer class="footer">
      <p>Powered by @ldesign/engine-vue3 + @ldesign/router</p>
      <p>当前时间: {{ currentTime }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Navigation from './components/Navigation.vue'
import RouterView from './components/RouterView.vue'
import Home from './pages/Home.vue'
import About from './pages/About.vue'
import User from './pages/User.vue'

// 添加版本号用于测试热更新
const version = ref(1)
const currentTime = ref(new Date().toLocaleTimeString())

// 定义路由配置（与 main.ts 中的配置保持一致）
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/user/:id', component: User },
]

// 定时更新版本号和时间，触发日志输出
onMounted(() => {
  console.log('🚀 App.vue mounted - 这是一个测试日志，用于验证实时日志功能')
  console.log('📦 当前版本:', version.value)
  
  // 每秒更新时间和版本号，触发日志输出
  const interval = setInterval(() => {
    version.value++
    currentTime.value = new Date().toLocaleTimeString()
    console.log(`⏰ 时间更新: ${currentTime.value}, 版本: ${version.value}`)
  }, 5000) // 每5秒更新一次

  // 清理定时器
  onUnmounted(() => {
    clearInterval(interval)
    console.log('🛑 App.vue unmounted - 组件已卸载')
  })
})
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.feature {
  padding: 1.5rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #42b88315 0%, #35495e15 100%);
  border: 1px solid #42b88330;
}

.feature h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #333;
}

.feature p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
  color: #999;
}
</style>
