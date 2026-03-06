/**
 * EngineProvider 组件
 *
 * 为子组件提供引擎上下文，使子组件可以通过 useEngine() 等组合式 API 访问引擎功能
 *
 * @module components/EngineProvider
 */

import { defineComponent, provide, h, type PropType } from 'vue'
import type { VueEngine } from '../engine/vue-engine'
import type { ServiceContainer, ConfigManager } from '@ldesign/engine-core'
import { ENGINE_KEY, CONTAINER_KEY, CONFIG_KEY } from '../composables/use-engine'

/**
 * EngineProvider 属性
 */
export interface EngineProviderProps {
  /** 引擎实例 */
  engine: VueEngine
}

/**
 * EngineProvider 组件
 *
 * 将引擎实例注入到 Vue 组件树中
 *
 * @example
 * ```vue
 * <template>
 *   <EngineProvider :engine="engine">
 *     <App />
 *   </EngineProvider>
 * </template>
 *
 * <script setup>
 * import { EngineProvider, createVueEngine } from '@ldesign/engine-vue3'
 *
 * const engine = createVueEngine({ name: 'My App' })
 * await engine.init()
 * </script>
 * ```
 */
export const EngineProvider = defineComponent({
  name: 'EngineProvider',
  props: {
    engine: {
      type: Object as PropType<VueEngine>,
      required: true,
    },
  },
  setup(props, { slots }) {
    // 提供引擎实例
    provide(ENGINE_KEY, props.engine)

    // 提供服务容器
    if (props.engine.container) {
      provide(CONTAINER_KEY, props.engine.container)
    }

    // 提供配置管理器
    if (props.engine.configManager) {
      provide(CONFIG_KEY, props.engine.configManager)
    }

    // 同时提供字符串键
    provide('engine', props.engine)
    provide('container', props.engine.container)
    provide('config', props.engine.configManager)

    return () => slots.default?.()
  },
})
