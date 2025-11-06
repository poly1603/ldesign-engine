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
        console.warn('Router not available in engine')
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

    updateRoute()
    const unsubscribe = engine.events.on('router:navigated', updateRoute)

    return () => {
      if (unsubscribe) unsubscribe()
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

