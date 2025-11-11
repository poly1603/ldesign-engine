import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'

interface Route {
  path: string
  component: any
}

interface RouterViewProps {
  routes: Route[]
}

export default function RouterView({ routes }: RouterViewProps) {
  const engine = useEngine()
  const [currentPath, setCurrentPath] = useState('/')
  const [CurrentComponent, setCurrentComponent] = useState<any>(null)

  useEffect(() => {
    const updateRoute = () => {
      if (!engine.router) {
        // 路由器尚未就绪，等待安装事件或全局就绪事件
        return
      }

      const route = engine.router.getCurrentRoute()
      const path = route.value?.path || '/'
      setCurrentPath(path)

      // 查找匹配的路由
      const matchedRoute = routes.find(r => {
        if (r.path === path) return true
        // 简单的参数匹配（例如 /user/:id）
        const pathPattern = r.path.replace(/:\w+/g, '[^/]+')
        const regex = new RegExp(`^${pathPattern}$`)
        return regex.test(path)
      })

      if (matchedRoute) {
        setCurrentComponent(() => matchedRoute.component)
      } else {
        setCurrentComponent(null)
      }
    }

    // 1) 首次尝试更新（如果路由器已可用则立即生效）
    updateRoute()

    // 2) 监听引擎路由安装完成事件，确保路由器就绪后立即刷新
    const offInstalled = engine.events.on?.('router:installed', updateRoute)

    // 3) 监听正常的导航事件
    const offNavigated = engine.events.on?.('router:navigated', updateRoute)

    // 4) 监听浏览器 hash 变化（用户直接修改地址或前进/后退但未触发事件时）
    const onHashChange = () => updateRoute()
    window.addEventListener('hashchange', onHashChange)

    // 5) 兜底：若路由器稍晚注入，短暂轮询一次以避免首屏 404
    let tries = 0
    const timer = setInterval(() => {
      if (engine.router || tries++ > 20) {
        clearInterval(timer)
        updateRoute()
      }
    }, 50)

    return () => {
      if (offInstalled) offInstalled()
      if (offNavigated) offNavigated()
      window.removeEventListener('hashchange', onHashChange)
      clearInterval(timer)
    }
  }, [engine, routes])

  if (!CurrentComponent) {
    return (
      <div class="page">
        <h2>404 - 页面未找到</h2>
        <p>路径: {currentPath}</p>
      </div>
    )
  }

  return (
    <div class="router-view">
      <CurrentComponent />
    </div>
  )
}

