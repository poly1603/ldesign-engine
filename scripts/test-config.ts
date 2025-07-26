#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import chalk from 'chalk'

interface ConfigItem {
  name: string
  envKey: string
  description: string
  required: boolean
  category: string
  icon: string
}

const CONFIG_ITEMS: ConfigItem[] = [
  // NPM 相关
  {
    name: 'NPM Token',
    envKey: 'NPM_TOKEN',
    description: '用于发布包到 NPM 注册表',
    required: true,
    category: 'NPM',
    icon: '📦',
  },
  {
    name: 'NPM Registry',
    envKey: 'NPM_REGISTRY',
    description: 'NPM 注册表地址',
    required: false,
    category: 'NPM',
    icon: '🌐',
  },
  
  // GitHub 相关
  {
    name: 'GitHub Token',
    envKey: 'GITHUB_TOKEN',
    description: '用于 GitHub Actions 和 API 访问',
    required: true,
    category: 'GitHub',
    icon: '🐙',
  },
  {
    name: 'GitHub Repository',
    envKey: 'GITHUB_REPOSITORY',
    description: 'GitHub 仓库地址',
    required: false,
    category: 'GitHub',
    icon: '📁',
  },
  
  // 测试覆盖率相关
  {
    name: 'CodeCov Token',
    envKey: 'CODECOV_TOKEN',
    description: '用于上传测试覆盖率报告',
    required: false,
    category: '测试覆盖率',
    icon: '📊',
  },
  
  // 安全相关
  {
    name: 'Snyk Token',
    envKey: 'SNYK_TOKEN',
    description: '用于安全漏洞扫描',
    required: false,
    category: '安全',
    icon: '🔒',
  },
  
  // 部署相关
  {
    name: 'Netlify Auth Token',
    envKey: 'NETLIFY_AUTH_TOKEN',
    description: '用于部署到 Netlify',
    required: false,
    category: '部署',
    icon: '🌐',
  },
  {
    name: 'Vercel Token',
    envKey: 'VERCEL_TOKEN',
    description: '用于部署到 Vercel',
    required: false,
    category: '部署',
    icon: '▲',
  },
  
  // 构建相关
  {
    name: 'Node Environment',
    envKey: 'NODE_ENV',
    description: 'Node.js 运行环境',
    required: false,
    category: '构建',
    icon: '⚙️',
  },
  {
    name: 'Build Target',
    envKey: 'BUILD_TARGET',
    description: '构建目标环境',
    required: false,
    category: '构建',
    icon: '🎯',
  },
]

interface ConfigStatus {
  item: ConfigItem
  isConfigured: boolean
  source: 'env' | 'file' | 'none'
  value?: string
  maskedValue?: string
}

class ConfigChecker {
  private envFilePath = join(process.cwd(), '.env.local')
  private configStatuses: ConfigStatus[] = []

  constructor() {
    this.checkAllConfigs()
  }

  private checkAllConfigs(): void {
    this.configStatuses = CONFIG_ITEMS.map(item => {
      // 检查环境变量
      const envValue = process.env[item.envKey]
      if (envValue) {
        return {
          item,
          isConfigured: true,
          source: 'env' as const,
          value: envValue,
          maskedValue: this.maskValue(envValue),
        }
      }

      // 检查 .env.local 文件
      if (existsSync(this.envFilePath)) {
        const envContent = readFileSync(this.envFilePath, 'utf-8')
        const match = envContent.match(new RegExp(`^${item.envKey}=(.+)$`, 'm'))
        if (match) {
          const fileValue = match[1]
          return {
            item,
            isConfigured: true,
            source: 'file' as const,
            value: fileValue,
            maskedValue: this.maskValue(fileValue),
          }
        }
      }

      return {
        item,
        isConfigured: false,
        source: 'none' as const,
      }
    })
  }

  private maskValue(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length)
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
  }

  private getSourceIcon(source: 'env' | 'file' | 'none'): string {
    switch (source) {
      case 'env':
        return '🌍'
      case 'file':
        return '📄'
      default:
        return '❌'
    }
  }

  private getSourceText(source: 'env' | 'file' | 'none'): string {
    switch (source) {
      case 'env':
        return '环境变量'
      case 'file':
        return '.env.local'
      default:
        return '未配置'
    }
  }

  displaySummary(): void {
    console.log(chalk.blue.bold('📋 @ldesign/engine 配置状态检查\n'))

    const totalConfigs = this.configStatuses.length
    const configuredCount = this.configStatuses.filter(status => status.isConfigured).length
    const requiredCount = this.configStatuses.filter(status => status.item.required).length
    const requiredConfiguredCount = this.configStatuses.filter(
      status => status.item.required && status.isConfigured
    ).length

    console.log(chalk.yellow.bold('📊 总体状态:'))
    console.log(chalk.white(`  总配置项: ${totalConfigs}`))
    console.log(chalk.white(`  已配置: ${configuredCount}/${totalConfigs}`))
    console.log(chalk.white(`  必需配置: ${requiredConfiguredCount}/${requiredCount}`))
    
    const completionRate = Math.round((configuredCount / totalConfigs) * 100)
    const requiredCompletionRate = requiredCount > 0 ? Math.round((requiredConfiguredCount / requiredCount) * 100) : 100
    
    console.log(chalk.white(`  完成度: ${completionRate}%`))
    console.log(chalk.white(`  必需项完成度: ${requiredCompletionRate}%`))
    console.log()

    // 显示状态指示器
    if (requiredCompletionRate === 100) {
      console.log(chalk.green.bold('✅ 所有必需配置已完成!'))
    } else {
      console.log(chalk.red.bold('❌ 还有必需配置未完成!'))
    }
    console.log()
  }

  displayByCategory(): void {
    const categories = [...new Set(CONFIG_ITEMS.map(item => item.category))]
    
    categories.forEach(category => {
      const categoryStatuses = this.configStatuses.filter(
        status => status.item.category === category
      )
      
      console.log(chalk.cyan.bold(`📂 ${category}:`))
      
      categoryStatuses.forEach(status => {
        const { item, isConfigured, source, maskedValue } = status
        const statusIcon = isConfigured ? chalk.green('✅') : chalk.red('❌')
        const requiredIcon = item.required ? chalk.yellow('⭐') : ''
        const sourceIcon = this.getSourceIcon(source)
        const sourceText = this.getSourceText(source)
        
        console.log(chalk.white(`  ${item.icon} ${item.name} ${statusIcon}${requiredIcon}`))
        console.log(chalk.gray(`    ${item.description}`))
        console.log(chalk.gray(`    环境变量: ${item.envKey}`))
        
        if (isConfigured) {
          console.log(chalk.gray(`    来源: ${sourceIcon} ${sourceText}`))
          console.log(chalk.gray(`    值: ${maskedValue}`))
        } else {
          console.log(chalk.gray(`    状态: ${sourceIcon} ${sourceText}`))
        }
        console.log()
      })
    })
  }

  displayMissingRequired(): void {
    const missingRequired = this.configStatuses.filter(
      status => status.item.required && !status.isConfigured
    )
    
    if (missingRequired.length === 0) {
      console.log(chalk.green.bold('🎉 所有必需配置都已完成!'))
      return
    }
    
    console.log(chalk.red.bold('⚠️  缺少的必需配置:'))
    console.log()
    
    missingRequired.forEach(status => {
      const { item } = status
      console.log(chalk.red(`❌ ${item.icon} ${item.name}`))
      console.log(chalk.white(`   描述: ${item.description}`))
      console.log(chalk.white(`   环境变量: ${item.envKey}`))
      console.log(chalk.gray(`   类别: ${item.category}`))
      console.log()
    })
  }

  displayConfigurationGuide(): void {
    console.log(chalk.yellow.bold('📖 配置指南:'))
    console.log()
    
    console.log(chalk.white('有两种方式配置环境变量:'))
    console.log()
    
    console.log(chalk.cyan.bold('方式 1: 使用配置管理工具 (推荐)'))
    console.log(chalk.white('  运行: tsx scripts/config-manager.ts'))
    console.log(chalk.gray('  - 交互式配置界面'))
    console.log(chalk.gray('  - 自动保存到 .env.local 文件'))
    console.log(chalk.gray('  - 提供详细的获取说明'))
    console.log()
    
    console.log(chalk.cyan.bold('方式 2: 手动配置'))
    console.log(chalk.white('  1. 创建 .env.local 文件'))
    console.log(chalk.white('  2. 添加环境变量，格式: KEY=value'))
    console.log(chalk.white('  3. 重新运行此检查脚本'))
    console.log()
    
    console.log(chalk.yellow.bold('注意事项:'))
    console.log(chalk.gray('  - .env.local 文件已添加到 .gitignore'))
    console.log(chalk.gray('  - 不要将敏感信息提交到版本控制'))
    console.log(chalk.gray('  - 环境变量优先级高于 .env.local 文件'))
    console.log()
  }

  generateReport(): void {
    console.clear()
    
    this.displaySummary()
    this.displayByCategory()
    this.displayMissingRequired()
    this.displayConfigurationGuide()
    
    console.log(chalk.blue.bold('🔄 重新检查配置:'))
    console.log(chalk.white('  运行: tsx scripts/test-config.ts'))
    console.log()
  }
}

// 运行配置检查
if (import.meta.url.includes('test-config.ts') || process.argv[1]?.includes('test-config.ts')) {
  const checker = new ConfigChecker()
  checker.generateReport()
}

export { ConfigChecker }