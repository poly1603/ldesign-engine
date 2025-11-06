import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'

interface NavLinkProps {
  to: string
  children: any
}

function NavLink({ to, children }: NavLinkProps) {
  const engine = useEngine()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!engine.router) return

    const checkActive = () => {
      const route = engine.router!.getCurrentRoute()
      const currentPath = route.value?.path || '/'
      setIsActive(currentPath === to || currentPath.startsWith(to + '/'))
    }

    checkActive()
    const unsubscribe = engine.events.on('router:navigated', checkActive)

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [engine.router, to])

  const handleClick = (e: Event) => {
    e.preventDefault()
    if (engine.router) {
      engine.router.push(to)
    }
  }

  return (
    <a href={to} onClick={handleClick} class={`nav-link ${isActive ? 'active' : ''}`}>
      {children}
    </a>
  )
}

export default function Navigation() {
  return (
    <nav class="navigation">
      <div class="nav-brand">
        <h1>🚀 Preact + LDesign Engine</h1>
      </div>
      <div class="nav-links">
        <NavLink to="/">🏠 首页</NavLink>
        <NavLink to="/about">ℹ️ 关于</NavLink>
        <NavLink to="/user/1">👤 用户</NavLink>
      </div>
    </nav>
  )
}

