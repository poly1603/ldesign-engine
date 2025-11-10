/** 生产环境应用配置（Solid） */
export default {
  app: { name: 'Solid Engine Example', version: '1.0.1', description: 'Solid 示例 - 生产环境' },
  api: { baseUrl: 'https://api.example.com', timeout: 30000 },
  features: { enableAnalytics: true, enableDebug: false },
  theme: { primaryColor: '#2c4f7c', mode: 'light' },
  dev: { showConfigPanel: false, logLevel: 'warn', enableHotReload: false }
}

