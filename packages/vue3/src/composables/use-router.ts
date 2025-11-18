/**
 * 路由相关的组合式 API
 *
 * 提供在组件中使用路由功能的 Composition API
 *
 * @module composables/use-router
 */

import { computed, ref, Ref, onUnmounted } from 'vue'
import { useService, useEngine, useEngineState } from './use-engine'
import type { RouterService } from '../plugins/router-plugin'

/**
 * 使用路由服务
 * 
 * @returns 路由服务实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRouterService } from '@ldesign/engine-vue3'
 * 
 * const router = useRouterService()
 * 
 * // 导航到指定路由
 * const goToAbout = () => {
 *   router.push('/about')
 * }
 * </script>
 * ```
 */
export function useRouterService(): RouterService {
  return useService<RouterService>('router')
}

/**
 * 使用当前路由
 * 
 * @returns 响应式的当前路由
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useCurrentRoute } from '@ldesign/engine-vue3'
 * 
 * const route = useCurrentRoute()
 * 
 * // 访问当前路由信息
 * console.log(route.value.path)
 * console.log(route.value.params)
 * console.log(route.value.query)
 * </script>
 * ```
 */
export function useCurrentRoute(): Ref<any> {
  const [route] = useEngineState('router:current')
  return route
}

/**
 * 使用路由历史
 * 
 * @returns 路由历史记录
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRouteHistory } from '@ldesign/engine-vue3'
 * 
 * const history = useRouteHistory()
 * 
 * // 显示访问历史
 * <div v-for="item in history.value" :key="item.timestamp">
 *   {{ item.path }} - {{ new Date(item.timestamp).toLocaleString() }}
 * </div>
 * </script>
 * ```
 */
export function useRouteHistory(): Ref<any[]> {
  const [history] = useEngineState('router:history', [])
  return history
}

/**
 * 使用路由标签页
 * 
 * @returns 标签页相关的状态和方法
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRouteTabs } from '@ldesign/engine-vue3'
 * 
 * const { tabs, activeTab, closeTab, closeOtherTabs, closeAllTabs } = useRouteTabs()
 * 
 * // 渲染标签页
 * <div v-for="tab in tabs.value" :key="tab.path">
 *   <span>{{ tab.title }}</span>
 *   <button @click="closeTab(tab.path)">×</button>
 * </div>
 * </script>
 * ```
 */
export function useRouteTabs() {
  const engine = useEngine()
  const router = useRouterService()
  const [tabs, setTabs] = useEngineState('router:tabs', [])
  const [activeTab, setActiveTab] = useEngineState('router:activeTab', '')

  /**
   * 关闭标签
   */
  const closeTab = (path: string) => {
    const currentTabs = tabs.value.filter((t: any) => t.path !== path)
    setTabs(currentTabs)

    // 如果关闭的是当前激活的标签，切换到最后一个标签
    if (activeTab.value === path && currentTabs.length > 0) {
      const lastTab = currentTabs[currentTabs.length - 1]
      router.push(lastTab.path)
    }
  }

  /**
   * 关闭其他标签
   */
  const closeOtherTabs = (path?: string) => {
    const keepPath = path || activeTab.value
    const currentTabs = tabs.value.filter((t: any) =>
      t.path === keepPath || t.meta?.affix
    )
    setTabs(currentTabs)
  }

  /**
   * 关闭所有标签
   */
  const closeAllTabs = () => {
    const currentTabs = tabs.value.filter((t: any) => t.meta?.affix)
    setTabs(currentTabs)

    // 如果没有固定标签，跳转到首页
    if (currentTabs.length === 0) {
      router.push('/')
    } else {
      router.push(currentTabs[0].path)
    }
  }

  /**
   * 关闭左侧标签
   */
  const closeLeftTabs = (path: string) => {
    const index = tabs.value.findIndex((t: any) => t.path === path)
    if (index > 0) {
      const currentTabs = [
        ...tabs.value.filter((t: any, i: number) => i === 0 && t.meta?.affix),
        ...tabs.value.slice(index)
      ]
      setTabs(currentTabs)
    }
  }

  /**
   * 关闭右侧标签
   */
  const closeRightTabs = (path: string) => {
    const index = tabs.value.findIndex((t: any) => t.path === path)
    if (index < tabs.value.length - 1) {
      const currentTabs = [
        ...tabs.value.slice(0, index + 1),
        ...tabs.value.filter((t: any, i: number) => i > index && t.meta?.affix)
      ]
      setTabs(currentTabs)
    }
  }

  /**
   * 刷新标签
   */
  const refreshTab = async (path?: string) => {
    const targetPath = path || activeTab.value

    // 触发刷新事件
    engine.events.emit('router:refresh', { path: targetPath })

    // 重新导航到当前路由以触发组件重新加载
    await router.replace({
      path: '/redirect',
      query: { redirect: targetPath }
    })

    setTimeout(() => {
      router.replace(targetPath)
    }, 0)
  }

  return {
    tabs,
    activeTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeLeftTabs,
    closeRightTabs,
    refreshTab,
  }
}

/**
 * 使用路由面包屑
 * 
 * @returns 面包屑数据
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useBreadcrumb } from '@ldesign/engine-vue3'
 * 
 * const breadcrumb = useBreadcrumb()
 * 
 * // 渲染面包屑
 * <nav>
 *   <span v-for="(item, index) in breadcrumb.value" :key="index">
 *     <router-link :to="item.path">{{ item.title }}</router-link>
 *     <span v-if="index < breadcrumb.value.length - 1"> / </span>
 *   </span>
 * </nav>
 * </script>
 * ```
 */
export function useBreadcrumb(): Ref<any[]> {
  const [breadcrumb] = useEngineState('router:breadcrumb', [])
  return breadcrumb
}

/**
 * 使用路由统计
 * 
 * @returns 路由访问统计
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRouteStats } from '@ldesign/engine-vue3'
 * 
 * const stats = useRouteStats()
 * 
 * // 显示访问统计
 * <div v-for="(count, path) in stats.value" :key="path">
 *   {{ path }}: {{ count }} 次访问
 * </div>
 * </script>
 * ```
 */
export function useRouteStats(): Ref<Record<string, number>> {
  const [stats] = useEngineState('router:stats', {})
  return stats
}

/**
 * 使用路由导航守卫
 *
 * @param guard - 守卫函数
 *
 * @example
 * ```vue
 * <script setup>
 * import { useNavigationGuard } from '@ldesign/engine-vue3'
 *
 * useNavigationGuard((to, from) => {
 *   console.log('Navigating from', from.path, 'to', to.path)
 *
 *   // 返回 false 取消导航
 *   // 返回路由路径或对象进行重定向
 *   if (to.meta.requiresAuth && !isLoggedIn.value) {
 *     return '/login'
 *   }
 * })
 * </script>
 * ```
 */
export function useNavigationGuard(
  guard: (to: any, from: any) => boolean | string | object | void
): void {
  const router = useRouterService()

  // 创建守卫处理函数
  const guardHandler = (to: any, from: any, next: any) => {
    const result = guard(to, from)

    if (result === false) {
      next(false)
    } else if (typeof result === 'string' || typeof result === 'object') {
      next(result)
    } else {
      next()
    }
  }

  // 注册导航守卫
  const removeGuard = router.router.beforeEach(guardHandler)

  // 组件卸载时移除守卫，防止内存泄漏
  onUnmounted(() => {
    if (typeof removeGuard === 'function') {
      removeGuard()
    }
  })
}

/**
 * 使用路由预加载
 * 
 * @returns 预加载相关方法
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRoutePreload } from '@ldesign/engine-vue3'
 * 
 * const { preload, preloadAll, isPreloaded } = useRoutePreload()
 * 
 * // 预加载特定路由
 * const handleMouseEnter = () => {
 *   preload('/about')
 * }
 * 
 * // 预加载所有路由
 * onMounted(() => {
 *   preloadAll()
 * })
 * </script>
 * ```
 */
export function useRoutePreload() {
  const router = useRouterService()
  const preloadedRoutes = ref(new Set<string>())

  /**
   * 预加载指定路由
   */
  const preload = async (path: string) => {
    if (preloadedRoutes.value.has(path)) {
      return
    }

    const route = router.resolve(path)
    if (route && route.matched.length > 0) {
      const components = route.matched.map((r: any) => r.components?.default)

      // 加载组件
      await Promise.all(
        components.map((component: any) => {
          if (typeof component === 'function') {
            return component()
          }
          return component
        })
      )

      preloadedRoutes.value.add(path)
    }
  }

  /**
   * 预加载所有路由
   */
  const preloadAll = async () => {
    const routes = router.getRoutes()

    await Promise.all(
      routes.map((route: any) => preload(route.path))
    )
  }

  /**
   * 检查路由是否已预加载
   */
  const isPreloaded = (path: string) => {
    return preloadedRoutes.value.has(path)
  }

  return {
    preload,
    preloadAll,
    isPreloaded,
    preloadedRoutes: computed(() => Array.from(preloadedRoutes.value)),
  }
}