/**
 * Playground 入口
 */

import { createVueEngine } from '@ldesign/engine-vue3'
import App from './App.vue'
import { counterPlugin, loggerPlugin, greetingPlugin } from './plugins'

// 创建引擎实例
const engine = createVueEngine({
  name: 'LDesign Playground',
  debug: true,
  environment: 'development',
  app: {
    rootComponent: App,
  },
  plugins: [loggerPlugin, counterPlugin, greetingPlugin],
})

// 挂载应用（引擎会自动创建 Vue 应用、注入上下文、安装插件）
engine.mount('#app')
