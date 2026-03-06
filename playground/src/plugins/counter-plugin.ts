/**
 * 计数器演示插件
 *
 * 展示引擎插件系统的基本用法：状态管理、事件通信、API 注册
 */

import { definePlugin } from '@ldesign/engine-core'

export interface CounterPluginOptions {
  /** 初始计数值 */
  initialValue?: number
  /** 最大值 */
  max?: number
  /** 最小值 */
  min?: number
}

export const counterPlugin = definePlugin<CounterPluginOptions>({
  name: 'counter',
  version: '1.0.0',

  install(context, options = {}) {
    const { engine } = context
    const { initialValue = 0, max = 100, min = 0 } = options

    // 初始化状态
    engine.state.set('counter:value', initialValue)
    engine.state.set('counter:max', max)
    engine.state.set('counter:min', min)
    engine.state.set('counter:history', [] as number[])

    // 注册 API（必须包含 name 和 version 字段）
    engine.api.register({
      name: 'counter',
      version: '1.0.0',
      increment() {
        const current = engine.state.get<number>('counter:value') ?? 0
        const maxVal = engine.state.get<number>('counter:max') ?? 100
        if (current < maxVal) {
          const newValue = current + 1
          engine.state.set('counter:value', newValue)
          const history = engine.state.get<number[]>('counter:history') ?? []
          engine.state.set('counter:history', [...history, newValue])
          engine.events.emit('counter:changed', { value: newValue, action: 'increment' })
        }
      },
      decrement() {
        const current = engine.state.get<number>('counter:value') ?? 0
        const minVal = engine.state.get<number>('counter:min') ?? 0
        if (current > minVal) {
          const newValue = current - 1
          engine.state.set('counter:value', newValue)
          const history = engine.state.get<number[]>('counter:history') ?? []
          engine.state.set('counter:history', [...history, newValue])
          engine.events.emit('counter:changed', { value: newValue, action: 'decrement' })
        }
      },
      reset() {
        engine.state.set('counter:value', initialValue)
        engine.state.set('counter:history', [])
        engine.events.emit('counter:changed', { value: initialValue, action: 'reset' })
      },
    })

    console.log(`[CounterPlugin] Installed with initial value: ${initialValue}`)
  },

  uninstall(context) {
    const { engine } = context
    engine.state.delete('counter:value')
    engine.state.delete('counter:max')
    engine.state.delete('counter:min')
    engine.state.delete('counter:history')
    console.log('[CounterPlugin] Uninstalled')
  },
})
