/** 开发环境应用配置（Svelte） */
export default {
  app: { name: 'Svelte Engine Example', version: '1.0.1', description: 'Svelte 示例 - 开发环境' },
  api: { baseUrl: 'http://localhost:8080/api', timeout: 30000 },
  features: { enableAnalytics: false, enableDebug: true },
  theme: { primaryColor: '#ff3e00', mode: 'light' },
  dev: { showConfigPanel: true, logLevel: 'debug', enableHotReload: true }
}

