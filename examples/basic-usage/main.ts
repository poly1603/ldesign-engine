/**
 * 基础使用示例
 * 
 * 展示如何快速开始使用 @ldesign/engine
 */

import { createEngine } from '@ldesign/engine'
import { createApp } from 'vue'
import App from './App.vue'

// 1. 创建引擎实例
const engine = createEngine({
  debug: true,
  logger: { level: 'debug' }
})

// 2. 创建Vue应用
const app = createApp(App)

// 3. 安装引擎
engine.install(app)

// 4. 挂载应用
app.mount('#app')

// 5. 使用引擎功能
console.log('引擎版本:', engine.config.get('version'))
console.log('环境信息:', engine.environment.detect())

// 6. 状态管理
engine.state.set('user', {
  name: 'Alice',
  role: 'admin'
})

engine.state.watch('user', (newValue, oldValue) => {
  console.log('用户状态变更:', newValue)
})

// 7. 事件系统
engine.events.on('user:login', (userData) => {
  console.log('用户登录:', userData)
  engine.state.set('user', userData)
})

// 8. 缓存使用
engine.cache.set('app-config', {
  theme: 'dark',
  language: 'zh-CN'
}, 3600000) // 1小时缓存

// 9. 清理（应用卸载时）
window.addEventListener('beforeunload', async () => {
  await engine.destroy()
})

