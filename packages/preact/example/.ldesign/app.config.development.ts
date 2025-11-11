/** 开发环境应用配置（Preact） */
export default {
  app: { name: 'Preact Engine Example', version: '1.0.1', description: 'Preact 示例 - 开发环境' },
  api: { baseUrl: 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#aa00ff', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'debug', enableHotReload: true }
}

