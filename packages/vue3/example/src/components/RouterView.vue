<template>
  <component :is="currentComponent" v-if="currentComponent" />
  <div v-else class="page">
    <h2>404 - 页面未找到</h2>
    <p>路径: {{ currentPath }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Component } from 'vue'
import { useEngine } from '@ldesign/engine-vue3'

interface Route {
  path: string
  component: Component
}

const props = defineProps<{
  routes: Route[]
}>()

const engine = useEngine()
const currentPath = ref('/')
const currentComponent = ref<Component | null>(null)

const updateRoute = () => {
  if (!engine.router) {
    console.warn('Router not available in engine')
    return
  }

  const route = engine.router.getCurrentRoute()
  const path = route.value?.path || '/'
  currentPath.value = path

  // 查找匹配的路由
  const matchedRoute = props.routes.find(r => {
    if (r.path === path) return true
    // 简单的参数匹配（例如 /user/:id）
    const pathPattern = r.path.replace(/:\w+/g, '[^/]+')
    const regex = new RegExp(`^${pathPattern}$`)
    return regex.test(path)
  })

  if (matchedRoute) {
    currentComponent.value = matchedRoute.component
  } else {
    currentComponent.value = null
  }
}

onMounted(() => {
  updateRoute()
  // 监听路由变化
  engine.events.on('router:navigated', updateRoute)
})

onUnmounted(() => {
  engine.events.off('router:navigated', updateRoute)
})
</script>

<style scoped>
.page {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

