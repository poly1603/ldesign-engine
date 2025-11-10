/**
 * 测试环境应用配置
 *
 * 测试环境特点：
 * - 启用调试功能
 * - 使用测试 API 地址
 * - 禁用分析统计
 */
export default {
  app: {
    name: 'Lit Engine Example',
    version: '1.0.1',
    description: 'Lit Engine 示例项目 - 测试环境'
  },

  api: {
    baseUrl: 'http://localhost:3001/api',
    timeout: 30000
  },

  features: {
    enableAnalytics: false,
    enableDebug: true
  },

  theme: {
    primaryColor: '#324fff',
    mode: 'light'
  },

  dev: {
    showConfigPanel: true,
    logLevel: 'info',
    enableHotReload: false
  }
}

