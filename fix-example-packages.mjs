#!/usr/bin/env node
/**
 * 修复所有框架适配包的 example package.json 文件
 * 解决格式化问题和缺少依赖的问题
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 定义框架配置
const frameworkConfigs = {
  alpinejs: {
    dependencies: {
      'alpinejs': '^3.13.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-alpinejs': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  angular: {
    dependencies: {
      '@angular/core': '^17.0.0',
      '@angular/common': '^17.0.0',
      '@angular/platform-browser': '^17.0.0',
      '@angular/platform-browser-dynamic': '^17.0.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-angular': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@analogjs/vite-plugin-angular': '^1.0.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  astro: {
    dependencies: {
      'astro': '^4.0.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-astro': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@astrojs/vite-plugin-astro': '^1.0.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  preact: {
    dependencies: {
      'preact': '^10.19.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-preact': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@preact/preset-vite': '^2.7.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  qwik: {
    dependencies: {
      '@builder.io/qwik': '^1.3.0',
      '@builder.io/qwik-city': '^1.3.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-qwik': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@builder.io/qwik-vite': '^1.3.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  remix: {
    dependencies: {
      '@remix-run/react': '^2.4.0',
      '@remix-run/node': '^2.4.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-remix': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@remix-run/dev': '^2.4.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  svelte: {
    dependencies: {
      'svelte': '^4.2.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-svelte': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@sveltejs/vite-plugin-svelte': '^3.0.0',
      'svelte-check': '^3.6.0',
      'tslib': '^2.6.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  sveltekit: {
    dependencies: {
      'svelte': '^4.2.0',
      '@sveltejs/kit': '^2.0.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-sveltekit': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@sveltejs/vite-plugin-svelte': '^3.0.0',
      'svelte-check': '^3.6.0',
      'tslib': '^2.6.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  nextjs: {
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-nextjs': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  },
  nuxtjs: {
    dependencies: {
      'nuxt': '^3.9.0',
      'vue': '^3.4.0',
      '@ldesign/engine-core': 'workspace:*',
      '@ldesign/engine-nuxtjs': 'workspace:*'
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      'typescript': '^5.3.0',
      'vite': '^5.0.0'
    }
  }
}

// 修复每个框架的 package.json
for (const [framework, config] of Object.entries(frameworkConfigs)) {
  const packageJsonPath = join(__dirname, 'packages', framework, 'example', 'package.json')
  
  console.log(`修复 ${framework} 的 package.json...`)
  
  // 创建标准的 package.json 对象
  const packageJson = {
    name: `@ldesign/engine-${framework}-example`,
    version: '0.2.0',
    type: 'module',
    private: true,
    description: `${framework.charAt(0).toUpperCase() + framework.slice(1)} Engine 示例项目 - 演示 createEngineApp 的使用`,
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview'
    },
    dependencies: config.dependencies,
    devDependencies: config.devDependencies
  }
  
  try {
    // 写入文件（使用标准 JSON 格式，2空格缩进）
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
    console.log(`✓ ${framework} package.json 已修复`)
  } catch (error) {
    console.error(`✗ 修复 ${framework} 失败:`, error.message)
  }
}

console.log('\n所有 package.json 文件已修复完成！')
console.log('请运行 "pnpm install" 来安装依赖')

