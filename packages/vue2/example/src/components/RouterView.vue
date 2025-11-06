<template>
  <div class="router-view">
    <component :is="currentComponent" v-if="currentComponent" />
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script>
import { getEngine } from '@ldesign/engine-vue2'
import Home from '../pages/Home.vue'
import About from '../pages/About.vue'
import User from '../pages/User.vue'

const routes = {
  '/': Home,
  '/about': About,
  '/user/:id': User,
}

export default {
  name: 'RouterView',
  data() {
    return {
      currentComponent: null,
      unsubscribe: null,
    }
  },
  created() {
    this.updateComponent()
    
    const engine = getEngine()
    this.unsubscribe = engine.events.on('router:navigated', () => {
      this.updateComponent()
    })
  },
  beforeDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },
  methods: {
    updateComponent() {
      const engine = getEngine()
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        const path = route.value?.path || '/'
        
        // 简单的路由匹配
        if (routes[path]) {
          this.currentComponent = routes[path]
        } else if (path.startsWith('/user/')) {
          this.currentComponent = User
        } else {
          this.currentComponent = Home
        }
      } else {
        this.currentComponent = Home
      }
    },
  },
}
</script>

<style scoped>
.router-view {
  min-height: 400px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
}
</style>

