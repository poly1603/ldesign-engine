/**
 * VitePress 配置文件
 */

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LDesign Engine',
  description: '现代化、模块化的前端应用引擎',
  lang: 'zh-CN',

  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['meta', { name: 'theme-color', content: '#42b983' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'LDesign Engine' }],
    ['meta', { name: 'og:description', content: '现代化、模块化的前端应用引擎' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: '示例', link: '/examples/', activeMatch: '/examples/' },
      {
        text: '框架',
        items: [
          { text: 'Vue', link: '/guide/vue' },
          { text: 'React', link: '/guide/react' },
          { text: 'Angular', link: '/guide/angular' },
          { text: 'Solid', link: '/guide/solid' },
          { text: 'Svelte', link: '/guide/svelte' },
        ],
      },
      { text: '生态系统', link: '/ecosystem/', activeMatch: '/ecosystem/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '简介', link: '/guide/index' },
            { text: '安装', link: '/guide/installation' },
            { text: '快速开始', link: '/guide/getting-started' },
          ],
        },
        {
          text: '核心概念',
          items: [
            { text: '引擎架构', link: '/guide/core-concepts' },
            { text: '插件系统', link: '/guide/plugins' },
            { text: '中间件系统', link: '/guide/middleware' },
            { text: '状态管理', link: '/guide/state' },
            { text: '事件系统', link: '/guide/events' },
            { text: '缓存管理', link: '/guide/cache' },
          ],
        },
        {
          text: '框架集成',
          items: [
            { text: 'Vue 3', link: '/guide/vue-integration' },
            { text: 'React', link: '/guide/react' },
            { text: 'Angular', link: '/guide/angular' },
            { text: 'Solid', link: '/guide/solid' },
            { text: 'Svelte', link: '/guide/svelte' },
          ],
        },
        {
          text: '高级功能',
          items: [
            { text: '性能优化', link: '/guide/performance-optimization' },
            { text: '安全管理', link: '/guide/security' },
            { text: '日志系统', link: '/guide/logger' },
            { text: '错误处理', link: '/guide/error-handling' },
          ],
        },
        {
          text: '最佳实践',
          items: [
            { text: '开发指南', link: '/guide/development' },
            { text: '测试指南', link: '/guide/testing' },
            { text: '部署指南', link: '/guide/deployment' },
          ],
        },
      ],

      '/api/': [
        {
          text: '核心 API',
          items: [
            { text: 'CoreEngine', link: '/api/core' },
            { text: 'CacheManager', link: '/api/cache-manager' },
            { text: 'EventManager', link: '/api/event-manager' },
            { text: 'StateManager', link: '/api/state-manager' },
            { text: 'PluginManager', link: '/api/plugin-manager' },
            { text: 'MiddlewareManager', link: '/api/middleware-manager' },
            { text: 'LifecycleManager', link: '/api/lifecycle-manager' },
            { text: 'ConfigManager', link: '/api/config-manager' },
            { text: 'Logger', link: '/api/logger' },
          ],
        },
        {
          text: 'Vue API',
          items: [
            { text: 'createEngineApp', link: '/api/vue/create-engine-app' },
            { text: 'useEngine', link: '/api/vue/use-engine' },
            { text: '组合式 API', link: '/api/vue/composables' },
            { text: '指令', link: '/api/vue/directives' },
          ],
        },
        {
          text: 'React API',
          items: [
            { text: 'createEngineApp', link: '/api/react/create-engine-app' },
            { text: 'useEngine', link: '/api/react/use-engine' },
            { text: 'Hooks', link: '/api/react/hooks' },
          ],
        },
        {
          text: '类型定义',
          items: [
            { text: 'Engine Types', link: '/api/types/engine' },
            { text: 'Plugin Types', link: '/api/types/plugin' },
            { text: 'State Types', link: '/api/types/state' },
          ],
        },
      ],

      '/examples/': [
        {
          text: '基础示例',
          items: [
            { text: '快速开始', link: '/examples/basic' },
            { text: '状态管理', link: '/examples/state-management' },
            { text: '事件系统', link: '/examples/advanced' },
          ],
        },
        {
          text: '高级示例',
          items: [
            { text: '插件开发', link: '/examples/plugin-development' },
            { text: '中间件开发', link: '/examples/middleware-development' },
            { text: '微前端集成', link: '/examples/micro-frontend' },
          ],
        },
        {
          text: '完整项目',
          items: [
            { text: '待办事项应用', link: '/examples/projects/todo-app' },
            { text: '移动应用', link: '/examples/mobile' },
            { text: 'SSR 应用', link: '/examples/ssr' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/engine' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/ldesign/engine/edit/main/packages/engine/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present LDesign Team',
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
  },
})
