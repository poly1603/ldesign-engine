import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { getEngine } from '@ldesign/engine-lit'

@customElement('router-view')
export class RouterView extends LitElement {
  static styles = css`
    .router-view {
      min-height: 400px;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #999;
    }
  `

  @state()
  private currentComponent: any = null

  private engine = getEngine()
  private unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    
    if (!this.engine.router) {
      console.warn('Router not available')
      return
    }

    const updateComponent = () => {
      if (this.engine.router) {
        const route = this.engine.router.getCurrentRoute()
        if (route.value?.component) {
          this.currentComponent = route.value.component
        }
      }
    }

    updateComponent()
    this.unsubscribe = this.engine.events.on('router:navigated', updateComponent)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  render() {
    if (!this.currentComponent) {
      return html`
        <div class="router-view">
          <div class="loading">Loading...</div>
        </div>
      `
    }

    // 创建组件实例
    const component = document.createElement(this.currentComponent)
    
    return html`
      <div class="router-view">
        ${component}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'router-view': RouterView
  }
}

