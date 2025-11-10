import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik'
import { getEngine } from '@ldesign/engine-qwik'

export default component$(() => {
  const currentPath = useSignal('/')

  useVisibleTask$(() => {
    try {
      const engine = getEngine()
      if (engine.router) {
        const route = engine.router.getCurrentRoute()
        currentPath.value = route.value?.path || '/'

        const unsubscribe = engine.events.on('router:navigated', () => {
          if (engine.router) {
            const route = engine.router.getCurrentRoute()
            currentPath.value = route.value?.path || '/'
          }
        })
        return () => unsubscribe()
      }
    } catch (error) {
      console.warn('Engine not ready yet:', error)
    }
  })

  const navigate = $((path: string, event: Event) => {
    event.preventDefault()
    try {
      const engine = getEngine()
      if (engine.router) {
        engine.router.push(path)
      }
    } catch (error) {
      console.warn('Engine not ready:', error)
    }
  })

  const isActive = (path: string) => {
    return currentPath.value === path || currentPath.value.startsWith(path + '/')
  }

  return (
    <nav class="navigation">
      <div class="nav-container">
        <div class="nav-brand">
          <h1>🚀 Qwik + LDesign Engine</h1>
        </div>
        <div class="nav-links">
          <a
            href="#/"
            class={isActive('/') && !isActive('/user') && !isActive('/about') ? 'nav-link active' : 'nav-link'}
            onClick$={(e) => navigate('/', e)}
          >
            🏠 首页
          </a>
          <a
            href="#/about"
            class={isActive('/about') ? 'nav-link active' : 'nav-link'}
            onClick$={(e) => navigate('/about', e)}
          >
            ℹ️ 关于
          </a>
          <a
            href="#/user/1"
            class={isActive('/user') ? 'nav-link active' : 'nav-link'}
            onClick$={(e) => navigate('/user/1', e)}
          >
            👤 用户
          </a>
        </div>
      </div>

      <style>{`
        .navigation {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-brand h1 {
          margin: 0;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 1rem;
        }

        .nav-link {
          padding: 0.75rem 1.5rem;
          text-decoration: none;
          color: #666;
          border-radius: 6px;
          transition: all 0.3s;
          font-weight: 500;
        }

        .nav-link:hover {
          background: #f3f4f6;
          color: #333;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 1rem;
          }

          .nav-links {
            width: 100%;
            justify-content: center;
          }

          .nav-link {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </nav>
  )
})

