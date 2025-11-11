<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { getEngine } from '@ldesign/engine-svelte'

  const engine = getEngine()
  let CurrentComponent = $state<any>(null)
  let unsubscribe: (() => void) | undefined

  onMount(() => {
    if (!engine.router) {
      console.warn('Router not available')
      return
    }

    const updateComponent = () => {
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        console.log('Current route:', route)
        if (route.value?.component) {
          CurrentComponent = route.value.component
        }
      }
    }

    updateComponent()
    unsubscribe = engine.events.on('router:navigated', updateComponent)
  })

  onDestroy(() => {
    if (unsubscribe) unsubscribe()
  })
</script>

<div class="router-view">
  {#if CurrentComponent}
    <CurrentComponent />
  {:else}
    <div>Loading...</div>
  {/if}
</div>

