import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { getEngine } from '@ldesign/engine-qwik'

export default component$(() => {
  const CurrentComponent = useSignal<any>(null)
  const loading = useSignal(true)

  useVisibleTask$(() => {
    try {
      const engine = getEngine()
      if (!engine.router) {
        console.warn('Router not available')
        loading.value = false
        return
      }

      const updateComponent = () => {
        if (engine.router) {
          const route = engine.router.getCurrentRoute()
          if (route.value?.component) {
            CurrentComponent.value = route.value.component
            loading.value = false
          }
        }
      }

      updateComponent()
      const unsubscribe = engine.events.on('router:navigated', updateComponent)
      return () => unsubscribe()
    } catch (error) {
      console.warn('Engine not ready yet:', error)
      loading.value = false
    }
  })

  return (
    <div class="router-view">
      {loading.value ? (
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : CurrentComponent.value ? (
        <CurrentComponent.value />
      ) : (
        <div class="error">
          <h2>404 - Page Not Found</h2>
          <p>The requested page could not be found.</p>
        </div>
      )}

      <style>{`
        .router-view {
          min-height: calc(100vh - 200px);
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #666;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f4f6;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading p {
          margin-top: 1rem;
          font-size: 1.1rem;
        }

        .error {
          text-align: center;
          padding: 4rem 2rem;
        }

        .error h2 {
          font-size: 2rem;
          color: #333;
          margin: 0 0 1rem;
        }

        .error p {
          color: #666;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  )
})

