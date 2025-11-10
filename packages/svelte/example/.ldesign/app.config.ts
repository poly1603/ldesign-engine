/** 基础应用配置（Svelte） */
export default {
  app: { name: 'Svelte Engine Example', version: '1.0.1', description: 'Svelte Engine 示例项目 - 展示 @ldesign/engine-svelte 的使用' },
  api: { baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#ff3e00', mode: 'light' }
}

