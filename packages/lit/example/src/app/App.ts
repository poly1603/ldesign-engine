import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import '../components/app-navigation'
import '../components/router-view'

@customElement('app-root')
export class App extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #324fff 0%, #1e2bff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      color: #666;
      font-size: 1.1rem;
    }

    .main {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .feature {
      padding: 1.5rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #324fff15 0%, #1e2bff15 100%);
      border: 1px solid #324fff30;
    }

    .feature h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .feature p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      color: #999;
    }
  `

  render() {
    return html`
      <div class="app">
        <app-navigation></app-navigation>
        <main class="main">
          <router-view></router-view>
        </main>
        <footer class="footer">
          <p>Powered by @ldesign/engine-lit + @ldesign/router</p>
        </footer>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': App
  }
}




