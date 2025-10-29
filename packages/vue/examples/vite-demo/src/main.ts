import { createEngineApp } from '@ldesign/engine-vue'
import App from './App.vue'

// 创建并挂载引擎应用
createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'Vue Engine Demo',
    version: '1.0.0',
    debug: true,
  },
  plugins: [],
  middleware: [],
  features: {
    enableCaching: true,
    enablePerformanceMonitoring: true,
  },
}).then((engine) => {
  console.log('✅ Engine initialized:', engine)
  console.log('📊 Engine status:', engine.getStatus())
}).catch((error) => {
  console.error('❌ Failed to initialize engine:', error)
})


