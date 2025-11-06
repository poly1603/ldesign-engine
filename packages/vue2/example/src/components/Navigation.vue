<template>
  <nav class="navigation">
    <div class="nav-brand">
      <span class="logo">🚀</span>
      <span class="brand-name">LDesign Engine</span>
      <span class="framework-badge">Vue 2</span>
    </div>
    <div class="nav-links">
      <a
        v-for="link in links"
        :key="link.path"
        :href="link.path"
        :class="{ active: isActive(link.path) }"
        @click.prevent="navigate(link.path)"
      >
        {{ link.label }}
      </a>
    </div>
  </nav>
</template>

<script>
import { getEngine } from '@ldesign/engine-vue2'

export default {
  name: 'Navigation',
  data() {
    return {
      currentPath: '/',
      links: [
        { path: '/', label: '首页' },
        { path: '/about', label: '关于' },
        { path: '/user/1', label: '用户' },
      ],
      unsubscribe: null,
    }
  },
  created() {
    const engine = getEngine()
    if (engine.router) {
      const route = engine.router.getCurrentRoute()
      this.currentPath = route.value?.path || '/'
      
      this.unsubscribe = engine.events.on('router:navigated', () => {
        if (engine.router) {
          const route = engine.router.getCurrentRoute()
          this.currentPath = route.value?.path || '/'
        }
      })
    }
  },
  beforeDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },
  methods: {
    navigate(path) {
      const engine = getEngine()
      if (engine.router) {
        engine.router.push(path)
      }
    },
    isActive(path) {
      if (path === '/') {
        return this.currentPath === '/'
      }
      return this.currentPath.startsWith(path)
    },
  },
}
</script>

<style scoped>
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  font-size: 1.5rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
}

.framework-badge {
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s;
}

.nav-links a:hover {
  color: #667eea;
  background: #f3f4f6;
}

.nav-links a.active {
  color: #667eea;
  background: #eef2ff;
}
</style>

