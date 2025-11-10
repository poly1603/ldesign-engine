/**
 * 预发布环境应用配置
 *
 * 预发布环境特点：
 * - 禁用调试功能
 * - 使用预发布 API 地址
 * - 启用分析统计
 */
export default {
  app: {
    name: 'Qwik Engine Example',
    version: '1.0.1',
    description: 'Qwik Engine 示例项目 - 预发布环境'
  },

  api: {
    baseUrl: 'https://staging-api.example.com',
    timeout: 30000
  },

  features: {
    enableAnalytics: true,
    enableDebug: false
  },

  theme: {
    primaryColor: '#18b6f6',
    mode: 'light'
  },

  dev: {
    showConfigPanel: true,
    logLevel: 'info',
    enableHotReload: false
  }
}

