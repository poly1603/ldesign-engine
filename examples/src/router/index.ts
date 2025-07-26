import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import PluginsPage from '../pages/PluginsPage.vue'
import MiddlewarePage from '../pages/MiddlewarePage.vue'
import EventsPage from '../pages/EventsPage.vue'
import DIPage from '../pages/DIPage.vue'
import ConfigPage from '../pages/ConfigPage.vue'
import ErrorHandlingPage from '../pages/ErrorHandlingPage.vue'
import PerformancePage from '../pages/PerformancePage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      title: '首页',
      description: '引擎状态概览和功能导航'
    }
  },
  {
    path: '/plugins',
    name: 'Plugins',
    component: PluginsPage,
    meta: {
      title: '插件系统',
      description: '插件管理、依赖关系和动态加载'
    }
  },
  {
    path: '/middleware',
    name: 'Middleware',
    component: MiddlewarePage,
    meta: {
      title: '中间件系统',
      description: '生命周期管理和性能监控'
    }
  },
  {
    path: '/events',
    name: 'Events',
    component: EventsPage,
    meta: {
      title: '事件系统',
      description: '事件发布、监听和流可视化'
    }
  },
  {
    path: '/di',
    name: 'DI',
    component: DIPage,
    meta: {
      title: '依赖注入',
      description: '服务容器和依赖关系管理'
    }
  },
  {
    path: '/config',
    name: 'Config',
    component: ConfigPage,
    meta: {
      title: '配置管理',
      description: '配置编辑、监听和历史记录'
    }
  },
  {
    path: '/error-handling',
    name: 'ErrorHandling',
    component: ErrorHandlingPage,
    meta: {
      title: '错误处理',
      description: '错误监控、处理和恢复策略'
    }
  },
  {
    path: '/performance',
    name: 'Performance',
    component: PerformancePage,
    meta: {
      title: '性能监控',
      description: '性能指标、基准测试和优化建议'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - LDesign Engine Demo`
  } else {
    document.title = 'LDesign Engine Demo'
  }
  
  next()
})

export default router