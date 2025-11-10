/** 开发环境应用配置（Vue2） */
export default {
  app: { name: 'Vue 2 Engine Example', version: '1.0.1', description: 'Vue 2 示例 - 开发环境' },
  api: { baseUrl: 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#42b883', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'debug', enableHotReload: true }
}

