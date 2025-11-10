/** 基础应用配置（Solid） */
export default {
  app: { name: 'Solid Engine Example', version: '1.0.1', description: 'Solid Engine 示例项目 - 展示 @ldesign/engine-solid 的使用' },
  api: { baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#2c4f7c', mode: 'light' }
}

