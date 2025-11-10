/** 生产环境应用配置（React） */
export default {
  app: { name: 'React Engine Example', version: '1.0.1', description: 'React 示例 - 生产环境' },
  api: { baseUrl: 'https://api.example.com', timeout: 30000 },
  features: { enableAnalytics: true, enableDebug: false },
  theme: { primaryColor: '#61dafb', mode: 'light' },
  dev: { showConfigPanel: false, logLevel: 'warn', enableHotReload: false }
}

