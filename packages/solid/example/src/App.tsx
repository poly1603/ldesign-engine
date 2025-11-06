import { Component } from 'solid-js'
import { EngineContext } from '@ldesign/engine-solid'
import Navigation from './components/Navigation'
import RouterView from './components/RouterView'
import './App.css'

interface AppProps {
  engine: any
}

const App: Component<AppProps> = (props) => {
  return (
    <EngineContext.Provider value={props.engine}>
      <div class="app">
        <Navigation />
        <main class="main">
          <RouterView />
        </main>
        <footer class="footer">
          <p>Powered by @ldesign/engine-solid + @ldesign/router</p>
        </footer>
      </div>
    </EngineContext.Provider>
  )
}

export default App

