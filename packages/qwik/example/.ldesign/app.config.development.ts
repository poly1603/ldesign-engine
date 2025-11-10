/**
 * 开发环境应用配置
 *
 * 开发环境特点：
 * - 启用调试功能
 * - 使用本地 API 地址
 * - 禁用分析统计
 */
export default {
  app: {
    name: 'Qwik Engine Example',
    version: '2.0.1',
    description: 'Qwik Engine 示例项目 - 开发环境'
  },

  api: {
    baseUrl: 'http://localhost:8080/api',
    timeout: 30000
  },

  features: {
    enableAnalytics: false,
    enableDebug: true
  },

  theme: {
    primaryColor: '#18b6f6',
    mode: 'light'
  },

  dev: {
    showConfigPanel: true,
    logLevel: 'debug',
    enableHotReload: true
  }
}

