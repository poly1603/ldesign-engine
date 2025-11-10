/** 开发环境应用配置（React） */
export default {
  app: { name: 'React Engine Example', version: '1.0.1', description: 'React 示例 - 开发环境' },
  api: { baseUrl: 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#61dafb', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'debug', enableHotReload: true }
}

