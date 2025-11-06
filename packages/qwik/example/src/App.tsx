import { component$ } from '@builder.io/qwik'
import Navigation from './components/Navigation'
import RouterView from './components/RouterView'
import './App.css'

export default component$(() => {
  return (
    <div class="app">
      <Navigation />
      <main class="main">
        <RouterView />
      </main>
      <footer class="footer">
        <p>Powered by @ldesign/engine-qwik + @ldesign/router</p>
      </footer>
    </div>
  )
})
