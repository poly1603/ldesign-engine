/** 测试环境应用配置（Preact） */
export default {
  app: { name: 'Preact Engine Example', version: '1.0.1', description: 'Preact 示例 - 测试环境' },
  api: { baseUrl: 'http://localhost:3001/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#673ab8', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'silent', enableHotReload: false }
}

