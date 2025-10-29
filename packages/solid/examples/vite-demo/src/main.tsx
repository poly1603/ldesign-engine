import { createEngineApp } from '@ldesign/engine-solid'
import App from './App'

// 创建并挂载引擎应用
createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'Solid Engine Demo',
    version: '1.0.0',
    debug: true
  }
}).then((engine) => {
  console.log('✅ Engine initialized:', engine)
}).catch((error) => {
  console.error('❌ Failed to initialize engine:', error)
})


