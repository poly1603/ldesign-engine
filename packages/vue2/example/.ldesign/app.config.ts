/** 基础应用配置（Vue2） */
export default {
  app: { name: 'Vue 2 Engine Example', version: '1.0.1', description: 'Vue 2 Engine 示例项目 - 展示 @ldesign/engine-vue2 的使用' },
  api: { baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#42b883', mode: 'light' }
}

