/** 测试环境应用配置（Solid） */
export default {
  app: { name: 'Solid Engine Example', version: '1.0.1', description: 'Solid 示例 - 测试环境' },
  api: { baseUrl: 'http://localhost:3001/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#2c4f7c', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'silent', enableHotReload: false }
}

