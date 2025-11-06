<template>
  <nav class="navigation">
    <div class="nav-brand">
      <span class="logo">🚀</span>
      <span class="brand-name">LDesign Engine</span>
    </div>
    <div class="nav-links">
      <NavLink to="/">🏠 首页</NavLink>
      <NavLink to="/about">ℹ️ 关于</NavLink>
      <NavLink to="/user/1">👤 用户</NavLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, onMounted, onUnmounted } from 'vue'
import { useEngine } from '@ldesign/engine-vue3'

// NavLink 组件
const NavLink = defineComponent({
  name: 'NavLink',
  props: {
    to: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    const engine = useEngine()
    const isActive = ref(false)

    const checkActive = () => {
      if (!engine.router) return
      const route = engine.router.getCurrentRoute()
      const currentPath = route.value?.path || '/'
      isActive.value = currentPath === props.to || currentPath.startsWith(props.to + '/')
    }

    const handleClick = (e: Event) => {
      e.preventDefault()
      if (engine.router) {
        engine.router.push(props.to)
      }
    }

    onMounted(() => {
      checkActive()
      // 监听路由变化
      engine.events.on('router:navigated', checkActive)
    })

    onUnmounted(() => {
      engine.events.off('router:navigated', checkActive)
    })

    return () => h(
      'a',
      {
        href: props.to,
        class: ['nav-link', { active: isActive.value }],
        onClick: handleClick,
      },
      slots.default?.()
    )
  },
})
</script>

<style scoped>
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: white;
  font-size: 1.2rem;
}

.logo {
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>

