/**
 * Qwik 开发模式入口文件
 */
import { render } from '@builder.io/qwik'
import Root from './root'

// 渲染函数
function renderApp() {
  // 创建容器
  const container = document.createElement('div')
  container.id = 'app'
  document.body.appendChild(container)

  // 渲染 Qwik 根组件
  // Qwik 的 render 函数签名: render(document, rootNode, opts)
  // 第一个参数是 document 对象，第二个参数是要渲染的 JSX
  render(document, <Root />).then(() => {
    console.log('✅ Qwik 组件渲染完成')

    // 组件渲染完成后，初始化引擎
    import('./init-engine').then(({ initEngine }) => {
      initEngine().catch((error) => {
        console.error('❌ 引擎初始化失败:', error)
      })
    })
  }).catch((error) => {
    console.error('❌ Qwik 组件渲染失败:', error)
  })
}

// 检查 DOM 是否已经加载完成
if (document.readyState === 'loading') {
  // DOM 还在加载中，等待 DOMContentLoaded 事件
  document.addEventListener('DOMContentLoaded', renderApp)
} else {
  // DOM 已经加载完成，直接渲染
  renderApp()
}

