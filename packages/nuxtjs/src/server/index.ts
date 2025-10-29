/**
 * Nuxt.js Server Utilities
 */

import type { Engine } from '@ldesign/engine-core'

export async function createServerEngine(engine: Engine): Promise<Engine> {
  return engine
}

export function serializeEngineState(engine: Engine): string {
  const state = engine.state.getAll()
  return JSON.stringify(state)
}

export function generateStateScript(serializedState: string): string {
  return `<script>window.__NUXT_ENGINE_STATE__=${serializedState}</script>`
}

