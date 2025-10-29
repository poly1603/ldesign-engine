<script lang="ts">
/**
 * Svelte Engine Provider Component
 * 
 * 提供引擎上下文
 * 
 * @module components/EngineProvider
 */
import { setContext } from 'svelte'
import type { CoreEngine } from '@ldesign/engine-core'
import { ENGINE_CONTEXT_KEY } from '../engine-app'

/**
 * Engine Provider Props
 */
export let engine: CoreEngine

// 设置引擎上下文
setContext(ENGINE_CONTEXT_KEY, engine)
</script>

<slot />


