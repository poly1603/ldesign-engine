/** 预发布环境应用配置（Svelte） */
export default {
  app: { name: 'Svelte Engine Example', version: '1.0.1', description: 'Svelte 示例 - 预发布环境' },
  api: { baseUrl: 'https://staging-api.example.com', timeout: 30000 },
  features: { enableAnalytics: true, enableDebug: true },
  theme: { primaryColor: '#ff3e00', mode: 'light' }
}

