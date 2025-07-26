import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/engine',
  description: '强大的插件化引擎 - 构建可扩展、高性能的应用程序架构',
  
  // 基础配置
  base: '/',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  
  // 头部配置
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh-CN' }],
    ['meta', { name: 'og:site_name', content: '@ldesign/engine' }],
    ['meta', { name: 'og:image', content: '/og-image.png' }],
  ],
  
  // 主题配置
  themeConfig: {
    // 网站标题和 Logo
    logo: '/logo.svg',
    siteTitle: '@ldesign/engine',
    
    // 导航栏
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '示例', link: '/examples/' },
      {
        text: '生态系统',
        items: [
          { text: '@ldesign/store', link: '/ecosystem/store' },
          { text: '@ldesign/router', link: '/ecosystem/router' },
          { text: '@ldesign/ui', link: '/ecosystem/ui' },
          { text: '@ldesign/utils', link: '/ecosystem/utils' },
        ]
      },
      {
        text: '更多',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: '贡献指南', link: '/contributing' },
          { text: 'FAQ', link: '/faq' },
        ]
      }
    ],
    
    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '基本概念', link: '/guide/concepts' },
            { text: '配置选项', link: '/guide/configuration' },
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '引擎实例', link: '/guide/engine-instance' },
            { text: '插件系统', link: '/guide/plugin-system' },
            { text: '事件系统', link: '/guide/event-system' },
            { text: '中间件', link: '/guide/middleware' },
            { text: '状态管理', link: '/guide/state-management' },
          ]
        },
        {
          text: '高级特性',
          items: [
            { text: '插件开发', link: '/guide/plugin-development' },
            { text: '自定义事件', link: '/guide/custom-events' },
            { text: '性能优化', link: '/guide/performance' },
            { text: '调试技巧', link: '/guide/debugging' },
            { text: '最佳实践', link: '/guide/best-practices' },
          ]
        },
        {
          text: '部署与发布',
          items: [
            { text: '构建配置', link: '/guide/build-configuration' },
            { text: '生产部署', link: '/guide/production-deployment' },
            { text: '版本管理', link: '/guide/version-management' },
          ]
        },
        {
          text: '帮助与支持',
          items: [
            { text: '故障排除', link: '/guide/troubleshooting' },
            { text: '更新日志', link: '/guide/changelog' },
            { text: 'FAQ', link: '/guide/faq' },
          ]
        }
      ],
      
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'Engine 类', link: '/api/engine' },
            { text: '插件接口', link: '/api/plugin-interface' },
            { text: '事件系统', link: '/api/event-system' },
            { text: '中间件', link: '/api/middleware' },
            { text: '类型定义', link: '/api/types' },
            { text: '工具函数', link: '/api/utils' },
          ]
        },

      ],
      
      '/examples/': [
        {
          text: '基础示例',
          items: [
            { text: '概览', link: '/examples/' },
            { text: '基本用法', link: '/examples/basic-usage' },
            { text: '插件注册', link: '/examples/plugin-registration' },
            { text: '事件处理', link: '/examples/event-handling' },
          ]
        },
        {
          text: '进阶示例',
          items: [
            { text: '自定义插件', link: '/examples/custom-plugins' },
            { text: '中间件使用', link: '/examples/middleware-usage' },
            { text: '状态管理', link: '/examples/state-management' },
            { text: '高级用法', link: '/examples/advanced-usage' },
          ]
        },

      ]
    },
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/engine' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@ldesign/engine' },
    ],
    
    // 页脚
    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2024 LDesign Team'
    },
    
    // 编辑链接
    editLink: {
      pattern: 'https://github.com/ldesign/engine/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },
    
    // 最后更新时间
    lastUpdatedText: '最后更新',
    
    // 文档页脚
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    
    // 大纲配置
    outline: {
      label: '页面导航',
      level: [2, 3]
    },
    
    // 搜索配置
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        }
      }
    },
    
    // 返回顶部
    returnToTopLabel: '返回顶部',
    
    // 侧边栏菜单标签
    sidebarMenuLabel: '菜单',
    
    // 深色模式切换标签
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
  
  // Markdown 配置
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true,
    config: (md) => {
      // 自定义 markdown 插件配置
    }
  },
  
  // Vite 配置
  vite: {
    define: {
      __VUE_OPTIONS_API__: false
    },
    server: {
      host: true,
      port: 3000
    },
    build: {
      chunkSizeWarningLimit: 1000
    }
  },
  
  // 构建配置
  buildEnd: async (siteConfig) => {
    // 构建完成后的钩子
  },
  
  // 转换钩子
  transformHead: ({ pageData }) => {
    const head: any[] = []
    
    // 动态添加页面特定的 meta 标签
    if (pageData.frontmatter.description) {
      head.push(['meta', { name: 'description', content: pageData.frontmatter.description }])
    }
    
    return head
  },
  
  // 站点地图
  sitemap: {
    hostname: 'https://engine.ldesign.dev'
  }
})