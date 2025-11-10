/** 基础应用配置（Preact） */
export default {
  app: { name: 'Preact Engine Example', version: '1.0.1', description: 'Preact Engine 示例项目 - 展示 @ldesign/engine-preact 的使用' },
  api: { baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#673ab8', mode: 'light' }
}

