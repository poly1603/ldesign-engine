import { createEngineApp } from '@ldesign/engine-svelte'
import App from './App.svelte'

// 创建并挂载引擎应用
createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'Svelte Engine Demo',
    version: '1.0.0',
    debug: true
  }
}).then((engine) => {
  console.log('✅ Engine initialized:', engine)
}).catch((error) => {
  console.error('❌ Failed to initialize engine:', error)
})


