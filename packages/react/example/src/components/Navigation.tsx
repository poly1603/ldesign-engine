import React from 'react'
import { useEngine } from '@ldesign/engine-react'

interface NavLinkProps {
  to: string
  children: React.ReactNode
}

function NavLink({ to, children }: NavLinkProps) {
  const engine = useEngine()
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    if (!engine.router) return

    const checkActive = () => {
      const route = engine.router.getCurrentRoute()
      const currentPath = route.value?.path || '/'
      setIsActive(currentPath === to || currentPath.startsWith(to + '/'))
    }

    checkActive()

    // 监听路由变化
    const unsubscribe = engine.events.on('router:navigated', checkActive)
    return () => unsubscribe()
  }, [engine.router, to])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (engine.router) {
      engine.router.push(to)
    }
  }

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </a>
  )
}

function Navigation() {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <span className="logo">🚀</span>
        <span className="brand-name">LDesign Engine</span>
      </div>
      <div className="nav-links">
        <NavLink to="/">🏠 首页</NavLink>
        <NavLink to="/about">ℹ️ 关于</NavLink>
        <NavLink to="/user/1">👤 用户</NavLink>
      </div>
    </nav>
  )
}

export default Navigation

