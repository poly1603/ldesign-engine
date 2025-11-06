import './App.css'
import Navigation from './components/Navigation'
import RouterView from './components/RouterView'
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/user/:id', component: User },
]

export default function App() {
  return (
    <div class="app">
      <Navigation />
      <main class="main">
        <RouterView routes={routes} />
      </main>
      <footer class="footer">
        <p>Powered by @ldesign/engine-preact + @ldesign/router</p>
      </footer>
    </div>
  )
}

