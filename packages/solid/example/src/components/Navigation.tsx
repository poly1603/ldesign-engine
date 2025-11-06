import { createSignal, createEffect, onCleanup, JSX } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

interface NavLinkProps {
  to: string
  children: JSX.Element
}

function NavLink(props: NavLinkProps) {
  const engine = useEngine()
  const [isActive, setIsActive] = createSignal(false)

  const checkActive = () => {
    if (!engine.router) return
    const route = engine.router.getCurrentRoute()
    const currentPath = route.value?.path || '/'
    setIsActive(currentPath === props.to || currentPath.startsWith(props.to + '/'))
  }

  createEffect(() => {
    checkActive()
    const unsubscribe = engine.events.on('router:navigated', checkActive)
    onCleanup(() => {
      if (unsubscribe) unsubscribe()
    })
  })

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    if (engine.router) {
      engine.router.push(props.to)
    }
  }

  return (
    <a
      href={props.to}
      onClick={handleClick}
      classList={{ 'nav-link': true, active: isActive() }}
    >
      {props.children}
    </a>
  )
}

export default function Navigation() {
  return (
    <nav class="navigation">
      <div class="nav-brand">
        <h1>🚀 Solid + LDesign Engine</h1>
      </div>
      <div class="nav-links">
        <NavLink to="/">🏠 首页</NavLink>
        <NavLink to="/about">ℹ️ 关于</NavLink>
        <NavLink to="/user/1">👤 用户</NavLink>
      </div>
    </nav>
  )
}

