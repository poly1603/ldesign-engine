/**
 * Vue3 适配器模块
 *
 * @module adapter
 */

export { Vue3FrameworkAdapter, createVue3Adapter } from './vue3-adapter'
export { Vue3StateAdapter, createVue3StateAdapter } from './vue3-state-adapter'
export { Vue3EventAdapter, createVue3EventAdapter } from './vue3-event-adapter'

// 统一 API 别名
export { createVue3Adapter as createVueAdapter } from './vue3-adapter'

