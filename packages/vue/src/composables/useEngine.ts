/**
 * Vue3 组合式 API - useEngine
 */

import { inject } from 'vue'
import type { Vue3Engine } from '../types'

const ENGINE_INJECTION_KEY = 'engine'

/**
 * 使用引擎
 */
export function useEngine(): Vue3Engine {
  const engine = inject<Vue3Engine>(ENGINE_INJECTION_KEY)

  if (!engine) {
    throw new Error('Engine not found. Make sure to call createEngineApp first.')
  }

  return engine
}

