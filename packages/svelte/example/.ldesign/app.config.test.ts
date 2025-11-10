/** 测试环境应用配置（Svelte） */
export default {
  app: { name: 'Svelte Engine Example', version: '1.0.1', description: 'Svelte 示例 - 测试环境' },
  api: { baseUrl: 'http://localhost:3001/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#ff3e00', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'silent', enableHotReload: false }
}

