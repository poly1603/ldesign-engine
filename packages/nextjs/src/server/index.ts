/**
 * Next.js Server Utilities
 */

import type { Engine } from '@ldesign/engine-core'

/**
 * 创建服务端引擎实例
 */
export async function createServerEngine(engine: Engine): Promise<Engine> {
  // 服务端引擎初始化逻辑
  return engine
}

/**
 * 序列化引擎状态用于 SSR
 */
export function serializeEngineState(engine: Engine): string {
  const state = engine.state.getAll()
  return JSON.stringify(state)
}

/**
 * 生成注入脚本
 */
export function generateStateScript(serializedState: string): string {
  return `<script>window.__ENGINE_STATE__=${serializedState}</script>`
}

/**
 * Server Action: 更新状态
 */
export async function updateStateAction(path: string, value: any, engine: Engine): Promise<void> {
  'use server'
  engine.state.set(path, value)
}

/**
 * Server Action: 触发事件
 */
export async function emitEventAction(eventName: string, data: any, engine: Engine): Promise<void> {
  'use server'
  await engine.events.emit(eventName, data)
}

