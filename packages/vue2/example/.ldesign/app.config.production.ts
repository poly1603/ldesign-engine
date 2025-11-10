/** 生产环境应用配置（Vue2） */
export default {
  app: { name: 'Vue 2 Engine Example', version: '1.0.1', description: 'Vue 2 示例 - 生产环境' },
  api: { baseUrl: 'https://api.example.com', timeout: 30000 },
  features: { enableAnalytics: true, enableDebug: false },
  theme: { primaryColor: '#42b883', mode: 'light' },
  dev: { showConfigPanel: false, logLevel: 'warn', enableHotReload: false }
}

