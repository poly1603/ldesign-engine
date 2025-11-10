/** 基础应用配置（React） */
export default {
  app: {
    name: 'React Engine Example',
    version: '1.0.1',
    description: 'React Engine 示例项目 - 展示 @ldesign/engine-react 的使用'
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 30000
  },
  features: {
    enableAnalytics: false,
    enableDebug: true
  },
  theme: {
    primaryColor: '#61dafb',
    mode: 'light'
  }
}

