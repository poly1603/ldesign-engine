/**
 * 问候演示插件
 *
 * 展示生命周期钩子、服务容器、配置管理的用法
 */

import { definePlugin } from '@ldesign/engine-core'

export interface GreetingPluginOptions {
  defaultName?: string
  locale?: 'zh' | 'en'
}

const greetings: Record<string, Record<string, string>> = {
  zh: { morning: '早上好', afternoon: '下午好', evening: '晚上好' },
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
}

export const greetingPlugin = definePlugin<GreetingPluginOptions>({
  name: 'greeting',
  version: '1.0.0',

  install(context, options = {}) {
    const { engine, container } = context
    const { defaultName = 'User', locale = 'zh' } = options

    // 初始化状态
    engine.state.set('greeting:name', defaultName)
    engine.state.set('greeting:locale', locale)
    engine.state.set('greeting:message', '')
    engine.state.set('greeting:logs', [] as string[])

    const addLog = (msg: string) => {
      const logs = engine.state.get<string[]>('greeting:logs') ?? []
      engine.state.set('greeting:logs', [...logs, `[${new Date().toLocaleTimeString()}] ${msg}`])
    }

    // 注册服务到容器
    if (container) {
      container.singleton('greeter', {
        greet(name?: string) {
          const n = name || engine.state.get<string>('greeting:name') || defaultName
          const l = engine.state.get<string>('greeting:locale') || locale
          const hour = new Date().getHours()
          const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
          const msg = `${greetings[l]?.[period] ?? greetings.en[period]}, ${n}!`
          engine.state.set('greeting:message', msg)
          engine.events.emit('greeting:greeted', { name: n, message: msg })
          return msg
        },
      })
    }

    // 注册 API
    engine.api.register({
      name: 'greeting',
      version: '1.0.0',
      greet(name?: string) {
        return container?.resolve<any>('greeter')?.greet(name) ?? ''
      },
      setLocale(l: string) {
        engine.state.set('greeting:locale', l)
        addLog(`Locale changed to: ${l}`)
      },
      setName(n: string) {
        engine.state.set('greeting:name', n)
        addLog(`Name changed to: ${n}`)
      },
    })

    // 生命周期钩子演示
    engine.lifecycle.on('beforeMount', () => {
      addLog('Lifecycle: beforeMount - Greeting plugin ready')
    })

    engine.lifecycle.on('mounted', () => {
      addLog('Lifecycle: mounted - App is mounted')
      ;(engine.api as any).get('greeting')?.greet()
    })

    addLog('Greeting plugin installed')
  },

  uninstall(context) {
    const { engine } = context
    engine.state.delete('greeting:name')
    engine.state.delete('greeting:locale')
    engine.state.delete('greeting:message')
    engine.state.delete('greeting:logs')
  },
})
