<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { getEngine } from '@ldesign/engine-svelte'

  const engine = getEngine()
  let currentPath = $state('/')
  let unsubscribe: (() => void) | undefined

  onMount(() => {
    if (engine.router) {
      const route = engine.router.getCurrentRoute()
      currentPath = route.value?.path || '/'

      unsubscribe = engine.events.on('router:navigated', () => {
        if (engine.router) {
          const route = engine.router.getCurrentRoute()
          currentPath = route.value?.path || '/'
        }
      })
    }
  })

  onDestroy(() => {
    if (unsubscribe) unsubscribe()
  })

  function navigate(path: string, event: MouseEvent) {
    event.preventDefault()
    if (engine.router) {
      engine.router.push(path)
    }
  }

  function isActive(path: string): boolean {
    if (path === '/') {
      return currentPath === '/'
    }
    return currentPath === path || currentPath.startsWith(path + '/')
  }
</script>

<nav class="navigation">
  <div class="nav-brand">
    <h1>🚀 Svelte + LDesign Engine</h1>
  </div>
  <div class="nav-links">
    <a 
      href="/" 
      on:click={(e) => navigate('/', e)} 
      class="nav-link"
      class:active={isActive('/')}
    >
      🏠 首页
    </a>
    <a 
      href="/about" 
      on:click={(e) => navigate('/about', e)}
      class="nav-link"
      class:active={isActive('/about')}
    >
      ℹ️ 关于
    </a>
    <a 
      href="/user/1" 
      on:click={(e) => navigate('/user/1', e)}
      class="nav-link"
      class:active={isActive('/user')}
    >
      👤 用户
    </a>
  </div>
</nav>

