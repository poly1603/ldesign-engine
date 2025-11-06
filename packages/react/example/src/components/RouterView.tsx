import React, { useEffect, useState } from 'react'
import { useEngine } from '@ldesign/engine-react'

interface RouterViewProps {
  routes: Array<{
    path: string
    component: React.ComponentType
  }>
}

function RouterView({ routes }: RouterViewProps) {
  const engine = useEngine()
  const [currentPath, setCurrentPath] = useState('/')
  const [CurrentComponent, setCurrentComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    const updateRoute = () => {
      // 直接从window.location获取当前路径
      const path = window.location.pathname
      console.log('[RouterView] updateRoute called, path:', path)
      setCurrentPath(path)

      // 查找匹配的路由
      const matchedRoute = routes.find(r => {
        if (r.path === path) return true
        // 简单的参数匹配（例如 /user/:id）
        const pathPattern = r.path.replace(/:\w+/g, '[^/]+')
        const regex = new RegExp(`^${pathPattern}$`)
        return regex.test(path)
      })

      console.log('[RouterView] matchedRoute:', matchedRoute)

      if (matchedRoute) {
        setCurrentComponent(() => matchedRoute.component)
      } else {
        setCurrentComponent(null)
      }
    }

    updateRoute()

    // 监听路由变化 - 使用多种方式
    console.log('[RouterView] Setting up route listeners')

    // 1. 监听engine的router:navigated事件
    const unsubscribeEngine = engine.events.on('router:navigated', (data) => {
      console.log('[RouterView] router:navigated event received:', data)
      updateRoute()
    })

    // 2. 监听浏览器的popstate事件（处理浏览器前进/后退）
    const handlePopState = () => {
      console.log('[RouterView] popstate event')
      updateRoute()
    }
    window.addEventListener('popstate', handlePopState)

    // 3. 使用MutationObserver监听URL变化（处理pushState/replaceState）
    let lastPath = window.location.pathname
    const checkPathChange = () => {
      const currentPath = window.location.pathname
      if (currentPath !== lastPath) {
        console.log('[RouterView] Path changed from', lastPath, 'to', currentPath)
        lastPath = currentPath
        updateRoute()
      }
    }
    const intervalId = setInterval(checkPathChange, 100)

    return () => {
      unsubscribeEngine()
      window.removeEventListener('popstate', handlePopState)
      clearInterval(intervalId)
    }
  }, [engine, routes])

  if (!CurrentComponent) {
    return (
      <div className="page">
        <h2>404 - 页面未找到</h2>
        <p>路径: {currentPath}</p>
      </div>
    )
  }

  return <CurrentComponent />
}

export default RouterView

