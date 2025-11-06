/**
 * Qwik Engine 示例 - 入口文件
 */
import { render } from '@builder.io/qwik'
import App from './App'
import './global.css'

// 创建容器并渲染（Qwik 标准方式）
const container = document.createElement('div')
container.id = 'app'
document.body.appendChild(container)

// 渲染 Qwik 组件
render(container, <App />).then(() => {
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
