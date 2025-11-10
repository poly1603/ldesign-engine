/**
 * 生产环境应用配置
 *
 * 生产环境特点：
 * - 禁用调试功能
 * - 使用生产 API 地址
 * - 启用分析统计
 */
export default {
  app: {
    name: 'Lit Engine Example',
    version: '1.0.1',
    description: 'Lit Engine 示例项目 - 生产环境'
  },

  api: {
    baseUrl: 'https://api.example.com',
    timeout: 30000
  },

  features: {
    enableAnalytics: true,
    enableDebug: false
  },

  theme: {
    primaryColor: '#324fff',
    mode: 'light'
  },

  dev: {
    showConfigPanel: false,
    logLevel: 'warn',
    enableHotReload: false
  }
}

