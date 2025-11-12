/**
 * I18n 集成示例
 * 
 * 展示如何在 LDesign Engine 中使用 i18n 插件
 */

import { createVueEngine } from '../src'
import { createI18nPlugin } from '../src/plugins/i18n-plugin'

/**
 * 基础用法示例
 */
export async function basicUsageExample() {
  // 1. 创建 engine 实例
  const engine = createVueEngine({
    name: 'I18n Demo App',
    app: {
      rootComponent: {
        template: '<div>{{ $t("hello") }}</div>',
      },
    },
  })

  // 2. 使用 i18n 插件
  engine.use(createI18nPlugin({
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages: {
      'zh-CN': {
        hello: '你好',
        welcome: '欢迎使用 LDesign',
      },
      'en-US': {
        hello: 'Hello',
        welcome: 'Welcome to LDesign',
      },
    },
  }))

  // 3. 挂载应用
  await engine.mount('#app')

  // 4. 访问 i18n 服务
  const i18nService = engine.container.resolve('i18n')
  console.log('Current locale:', i18nService.getLocale())

  // 5. 切换语言
  i18nService.setLocale('en-US')

  // 6. 监听语言变化事件
  engine.events.on('i18n:localeChanged', (payload) => {
    console.log('Locale changed to:', payload.locale)
  })

  return engine
}

/**
 * 高级用法示例 - 动态加载语言包
 */
export async function advancedUsageExample() {
  const engine = createVueEngine({
    name: 'I18n Advanced Demo',
    app: {
      rootComponent: {
        template: '<div>{{ $t("app.title") }}</div>',
      },
    },
  })

  // 配置 i18n 插件
  engine.use(createI18nPlugin({
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages: {
      'zh-CN': {
        app: {
          title: '应用标题',
        },
      },
      'en-US': {
        app: {
          title: 'App Title',
        },
      },
    },
    // 启用缓存优化
    cache: true,
    cacheSize: 100,
    // 启用性能监控
    performance: true,
    // 预加载语言包
    preloadLocales: ['zh-CN', 'en-US'],
  }))

  await engine.mount('#app')

  // 获取 i18n 服务
  const i18nService = engine.container.resolve('i18n')

  // 动态添加语言包
  i18nService.addMessages('ja-JP', {
    app: {
      title: 'アプリタイトル',
    },
  })

  // 切换到日语
  i18nService.setLocale('ja-JP')

  return engine
}

/**
 * 组件中使用 i18n
 */
export const I18nComponent = {
  template: `
    <div>
      <h1>{{ $t('title') }}</h1>
      <p v-t="'description'"></p>
      <button @click="switchLocale">
        {{ $t('switchLanguage') }}
      </button>
    </div>
  `,
  setup() {
    // 使用 composable
    const { t, locale, setLocale } = useI18n()

    const switchLocale = () => {
      const newLocale = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
      setLocale(newLocale)
    }

    return {
      switchLocale,
    }
  },
}

/**
 * 状态管理集成示例
 */
export async function stateManagementExample() {
  const engine = createVueEngine({
    name: 'I18n State Demo',
  })

  engine.use(createI18nPlugin({
    locale: 'zh-CN',
    messages: {
      'zh-CN': { hello: '你好' },
      'en-US': { hello: 'Hello' },
    },
  }))

  await engine.mount('#app')

  // 从 engine 状态中读取当前语言
  const currentLocale = engine.state.get('i18n:locale')
  console.log('Current locale from state:', currentLocale)

  // 监听状态变化
  engine.state.watch('i18n:locale', (newLocale) => {
    console.log('Locale changed in state:', newLocale)
  })

  return engine
}

