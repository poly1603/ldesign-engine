/**
 * React Example - Main Entry
 * 
 * 演示如何使用 @ldesign/engine-react 创建应用
 */

import { createEngineApp } from '@ldesign/engine-react'
import { 
  createI18nPlugin, 
  createThemePlugin, 
  createSizePlugin,
  LOCALE_CODES,
  PRESET_THEMES 
} from '@ldesign/engine-core'
import App from './App'
import './index.css'

// 创建引擎应用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#root',
  
  // 引擎配置
  config: {
    name: 'React Example App',
    debug: true,
    logger: {
      level: 'debug',
      enabled: true
    }
  },

  // 注册插件
  plugins: [
    // i18n 插件
    createI18nPlugin({
      locale: LOCALE_CODES.ZH_CN,
      fallbackLocale: LOCALE_CODES.EN_US,
      messages: {
        [LOCALE_CODES.ZH_CN]: {
          hello: '你好',
          welcome: '欢迎, {name}!',
          app: {
            title: '我的应用',
            description: '这是一个演示应用'
          }
        },
        [LOCALE_CODES.EN_US]: {
          hello: 'Hello',
          welcome: 'Welcome, {name}!',
          app: {
            title: 'My App',
            description: 'This is a demo app'
          }
        }
      },
      warnOnMissing: true
    }),

    // 主题插件
    createThemePlugin({
      defaultTheme: 'light',
      themes: {
        light: PRESET_THEMES.light,
        dark: PRESET_THEMES.dark
      },
      persist: true,
      autoApply: true
    }),

    // 尺寸插件
    createSizePlugin({
      defaultSize: 'medium',
      sizes: ['small', 'medium', 'large'],
      persist: true,
      autoApply: true
    })
  ],

  // 就绪回调
  onReady: async (engine) => {
    console.log('[App] Engine ready', engine.getStatus())
  },

  // 挂载完成回调
  onMounted: async (engine) => {
    console.log('[App] App mounted')
  },

  // 错误处理
  onError: (error, context) => {
    console.error(`[App] Error in ${context}:`, error)
  }
})

// 导出引擎实例供调试使用
if (import.meta.env.DEV) {
  ;(window as any).__ENGINE__ = engine
  console.log('Engine instance available at window.__ENGINE__')
}

// 演示引擎 API
console.log('=== Engine API Demo ===')
console.log('Status:', engine.getStatus())
console.log('Current locale:', engine.getLocale())
console.log('Current theme:', engine.getTheme())
console.log('Current size:', engine.getSize())
console.log('Translation:', engine.t('hello'))
