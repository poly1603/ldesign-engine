/** 生产环境应用配置（Svelte） */
export default {
  app: { name: 'Svelte Engine Example', version: '1.0.1', description: 'Svelte 示例 - 生产环境' },
  api: { baseUrl: 'https://api.example.com', timeout: 30000 },
  features: { enableAnalytics: true, enableDebug: false },
  theme: { primaryColor: '#ff3e00', mode: 'light' },
  dev: { showConfigPanel: false, logLevel: 'warn', enableHotReload: false }
}

