#!/usr/bin/env tsx

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import chalk from 'chalk'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  ENTER: '\r',
  ESC: '\u001B[1b',
  CTRL_C: '\u0003',
}

interface MenuItem {
  name: string
  description: string
  command: string
  icon: string
  category: string
  requiresConfirm?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  // 开发相关
  {
    name: '启动开发模式',
    description: '启动 Vite 开发服务器',
    command: 'npm run dev',
    icon: '🚀',
    category: '开发',
  },
  {
    name: '监听模式构建',
    description: '启动 TypeScript 监听模式构建',
    command: 'npm run build:watch',
    icon: '👀',
    category: '开发',
  },
  {
    name: '类型检查',
    description: '运行 TypeScript 类型检查',
    command: 'npm run type-check',
    icon: '🔍',
    category: '开发',
  },
  
  // 质量检查
  {
    name: 'ESLint 检查',
    description: '运行 ESLint 代码检查',
    command: 'npm run lint',
    icon: '🔧',
    category: '质量检查',
  },
  {
    name: 'ESLint 修复',
    description: '自动修复 ESLint 问题',
    command: 'npm run lint:fix',
    icon: '🛠️',
    category: '质量检查',
  },
  {
    name: '代码格式化',
    description: '使用 Prettier 格式化代码',
    command: 'npm run format',
    icon: '💅',
    category: '质量检查',
  },
  {
    name: '运行测试',
    description: '运行所有测试用例',
    command: 'npm run test',
    icon: '🧪',
    category: '质量检查',
  },
  {
    name: '测试覆盖率',
    description: '运行测试并生成覆盖率报告',
    command: 'npm run test:coverage',
    icon: '📊',
    category: '质量检查',
  },
  {
    name: '测试监听模式',
    description: '启动测试监听模式',
    command: 'npm run test:watch',
    icon: '👁️',
    category: '质量检查',
  },
  
  // 构建相关
  {
    name: '构建项目',
    description: '构建生产版本',
    command: 'npm run build',
    icon: '📦',
    category: '构建',
  },
  {
    name: '构建文档',
    description: '构建 VitePress 文档',
    command: 'npm run docs:build',
    icon: '📚',
    category: '构建',
  },
  {
    name: '预览文档',
    description: '预览构建后的文档',
    command: 'npm run docs:preview',
    icon: '👀',
    category: '构建',
  },
  {
    name: '启动文档开发',
    description: '启动文档开发服务器',
    command: 'npm run docs:dev',
    icon: '📖',
    category: '构建',
  },
  
  // 部署相关
  {
    name: '发布到 NPM',
    description: '发布包到 NPM 注册表',
    command: 'npm run release',
    icon: '🚢',
    category: '部署',
    requiresConfirm: true,
  },
  {
    name: '预发布检查',
    description: '运行发布前的所有检查',
    command: 'npm run prerelease',
    icon: '✅',
    category: '部署',
  },
  
  // 分析相关
  {
    name: '包大小分析',
    description: '分析构建包大小',
    command: 'tsx scripts/bundle-analyzer.ts',
    icon: '📈',
    category: '分析',
  },
  {
    name: '性能基准测试',
    description: '运行性能基准测试',
    command: 'tsx scripts/benchmark.ts',
    icon: '⚡',
    category: '分析',
  },
  {
    name: '依赖分析',
    description: '分析项目依赖',
    command: 'npm run analyze:deps',
    icon: '🔗',
    category: '分析',
  },
  
  // 维护相关
  {
    name: '清理项目',
    description: '清理构建产物和缓存',
    command: 'tsx scripts/clean.ts',
    icon: '🧹',
    category: '维护',
  },
  {
    name: '更新依赖',
    description: '更新项目依赖',
    command: 'npm update',
    icon: '⬆️',
    category: '维护',
    requiresConfirm: true,
  },
  {
    name: '安全审计',
    description: '运行安全漏洞审计',
    command: 'npm audit',
    icon: '🔒',
    category: '维护',
  },
  {
    name: '配置管理',
    description: '管理 API Token 配置',
    command: 'tsx scripts/config-manager.ts',
    icon: '⚙️',
    category: '维护',
  },
]

class DevMenu {
  private selectedIndex = 0
  private selectedCategory = '全部'
  private isRunning = true
  private categories = ['全部', ...new Set(MENU_ITEMS.map(item => item.category))]
  private categoryIndex = 0

  constructor() {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
  }

  private getFilteredItems(): MenuItem[] {
    if (this.selectedCategory === '全部') {
      return MENU_ITEMS
    }
    return MENU_ITEMS.filter(item => item.category === this.selectedCategory)
  }

  private waitForKeyPress(): Promise<string> {
    return new Promise((resolve) => {
      const onKeyPress = (key: string) => {
        process.stdin.off('data', onKeyPress)
        resolve(key)
      }
      process.stdin.on('data', onKeyPress)
    })
  }

  private displayMenu(): void {
    console.clear()

    console.log(chalk.yellow.bold('🛠️  @ldesign/engine 开发工具'))
    console.log(chalk.gray('选择要执行的开发任务\n'))

    // 显示分类选择
    console.log(chalk.blue.bold('📂 分类:'))
    this.categories.forEach((category, index) => {
      if (category === this.selectedCategory) {
        console.log(chalk.bgBlue.white(`❯ ${category}`))
      } else {
        console.log(chalk.gray(`  ${category}`))
      }
    })
    console.log()

    // 显示当前分类的菜单项
    const filteredItems = this.getFilteredItems()
    console.log(chalk.blue.bold(`📋 ${this.selectedCategory} 任务:`))
    
    if (filteredItems.length === 0) {
      console.log(chalk.gray('  暂无可用任务'))
    } else {
      filteredItems.forEach((item, index) => {
        const isSelected = index === this.selectedIndex
        const confirmIcon = item.requiresConfirm ? chalk.yellow(' ⚠️') : ''
        
        if (isSelected) {
          console.log(chalk.bgGreen.black(`❯ ${item.icon} ${item.name}${confirmIcon}`))
          console.log(chalk.bgGreen.black(`  ${item.description}`))
          console.log(chalk.bgGreen.black(`  命令: ${item.command}`))
        } else {
          console.log(chalk.gray(`  ${item.icon} ${item.name}${confirmIcon}`))
          console.log(chalk.gray(`  ${item.description}`))
        }
        console.log()
      })
    }

    console.log(chalk.gray('操作说明:'))
    console.log(chalk.gray('  Tab - 切换分类'))
    console.log(chalk.gray('  ↑↓ - 选择任务'))
    console.log(chalk.gray('  Enter - 执行任务'))
    console.log(chalk.gray('  Ctrl+C - 退出'))
  }

  private async confirmAction(item: MenuItem): Promise<boolean> {
    console.clear()
    console.log(chalk.yellow.bold('⚠️  确认操作\n'))
    console.log(chalk.white(`任务: ${item.icon} ${item.name}`))
    console.log(chalk.white(`描述: ${item.description}`))
    console.log(chalk.white(`命令: ${item.command}`))
    console.log()
    console.log(chalk.yellow('确认执行此操作? (y/N)'))
    
    const key = await this.waitForKeyPress()
    return key.toLowerCase() === 'y'
  }

  private async executeCommand(command: string): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold(`🚀 执行命令: ${command}\n`))
    
    // 临时恢复正常模式以显示命令输出
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false)
    }

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ')
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd(),
      })

      child.on('close', (code) => {
        console.log()
        if (code === 0) {
          console.log(chalk.green.bold('✅ 命令执行成功!'))
        } else {
          console.log(chalk.red.bold(`❌ 命令执行失败 (退出码: ${code})`))
        }
        console.log(chalk.gray('按任意键继续...'))
        
        // 重新设置原始模式
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(true)
        }
        
        // 等待用户按键
        this.waitForKeyPress().then(() => resolve())
      })

      child.on('error', (error) => {
        console.log()
        console.log(chalk.red.bold(`❌ 命令执行错误: ${error.message}`))
        console.log(chalk.gray('按任意键继续...'))
        
        // 重新设置原始模式
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(true)
        }
        
        // 等待用户按键
        this.waitForKeyPress().then(() => reject(error))
      })
    })
  }

  private checkCommandAvailability(command: string): boolean {
    const [cmd] = command.split(' ')
    
    // 检查是否是 npm 脚本
    if (cmd === 'npm' && command.includes('run')) {
      const packageJsonPath = join(process.cwd(), 'package.json')
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = require(packageJsonPath)
          const scriptName = command.split('run ')[1]?.split(' ')[0]
          return !!(packageJson.scripts && packageJson.scripts[scriptName])
        } catch {
          return false
        }
      }
      return false
    }
    
    // 检查是否是 tsx 脚本
    if (cmd === 'tsx') {
      const scriptPath = command.split('tsx ')[1]?.split(' ')[0]
      if (scriptPath) {
        return existsSync(join(process.cwd(), scriptPath))
      }
    }
    
    return true
  }

  async run(): Promise<void> {
    try {
      while (this.isRunning) {
        this.displayMenu()
        const key = await this.waitForKeyPress()

        if (key === KEYS.CTRL_C) {
          this.isRunning = false
          break
        }

        if (key === '\t') { // Tab 键切换分类
          this.categoryIndex = (this.categoryIndex + 1) % this.categories.length
          this.selectedCategory = this.categories[this.categoryIndex]
          this.selectedIndex = 0
          continue
        }

        const filteredItems = this.getFilteredItems()
        
        if (key === KEYS.UP) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          continue
        }

        if (key === KEYS.DOWN) {
          this.selectedIndex = Math.min(filteredItems.length - 1, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER && filteredItems.length > 0) {
          const selectedItem = filteredItems[this.selectedIndex]
          
          // 检查命令是否可用
          if (!this.checkCommandAvailability(selectedItem.command)) {
            console.clear()
            console.log(chalk.red.bold('❌ 命令不可用'))
            console.log(chalk.white(`命令: ${selectedItem.command}`))
            console.log(chalk.gray('可能原因:'))
            console.log(chalk.gray('  - npm 脚本不存在'))
            console.log(chalk.gray('  - 脚本文件不存在'))
            console.log(chalk.gray('  - 依赖未安装'))
            console.log()
            console.log(chalk.gray('按任意键继续...'))
            await this.waitForKeyPress()
            continue
          }
          
          // 如果需要确认，先确认
          if (selectedItem.requiresConfirm) {
            const confirmed = await this.confirmAction(selectedItem)
            if (!confirmed) {
              continue
            }
          }
          
          try {
            await this.executeCommand(selectedItem.command)
          } catch (error) {
            // 错误已在 executeCommand 中处理
          }
        }
      }
    } finally {
      // 恢复终端设置
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
    }

    console.clear()
    console.log(chalk.green.bold('👋 感谢使用 @ldesign/engine 开发工具!'))
  }
}

// 运行开发菜单
if (import.meta.url.includes('dev.ts') || process.argv[1]?.includes('dev.ts')) {
  const devMenu = new DevMenu()
  devMenu.run().catch(console.error)
}

export { DevMenu }