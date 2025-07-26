#!/usr/bin/env tsx

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import chalk from 'chalk'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  LEFT: '\u001B[D',
  RIGHT: '\u001B[C',
  ENTER: '\r',
  ESC: '\u001B[1b',
  CTRL_C: '\u0003',
  TAB: '\t',
}

interface MenuAction {
  id: string
  name: string
  description: string
  command: string
  icon: string
  category: string
  subcategory?: string
  requiresConfirm?: boolean
  dangerous?: boolean
}

const MENU_ACTIONS: MenuAction[] = [
  // 开发类别
  {
    id: 'dev-start',
    name: '启动开发服务器',
    description: '启动 Vite 开发服务器，支持热重载',
    command: 'npm run dev',
    icon: '🚀',
    category: '开发',
    subcategory: '服务器',
  },
  {
    id: 'dev-build-watch',
    name: '监听构建',
    description: '启动 TypeScript 监听模式构建',
    command: 'npm run build:watch',
    icon: '👀',
    category: '开发',
    subcategory: '构建',
  },
  {
    id: 'dev-docs',
    name: '文档开发服务器',
    description: '启动 VitePress 文档开发服务器',
    command: 'npm run docs:dev',
    icon: '📖',
    category: '开发',
    subcategory: '文档',
  },
  
  // 质量检查类别
  {
    id: 'qa-type-check',
    name: 'TypeScript 类型检查',
    description: '运行 TypeScript 编译器进行类型检查',
    command: 'npm run type-check',
    icon: '🔍',
    category: '质量检查',
    subcategory: '类型',
  },
  {
    id: 'qa-lint',
    name: 'ESLint 检查',
    description: '运行 ESLint 进行代码质量检查',
    command: 'npm run lint',
    icon: '🔧',
    category: '质量检查',
    subcategory: '代码质量',
  },
  {
    id: 'qa-lint-fix',
    name: 'ESLint 自动修复',
    description: '自动修复可修复的 ESLint 问题',
    command: 'npm run lint:fix',
    icon: '🛠️',
    category: '质量检查',
    subcategory: '代码质量',
  },
  {
    id: 'qa-format',
    name: 'Prettier 格式化',
    description: '使用 Prettier 格式化所有代码',
    command: 'npm run format',
    icon: '💅',
    category: '质量检查',
    subcategory: '代码格式',
  },
  {
    id: 'qa-test',
    name: '运行测试',
    description: '运行所有测试用例',
    command: 'npm run test',
    icon: '🧪',
    category: '质量检查',
    subcategory: '测试',
  },
  {
    id: 'qa-test-coverage',
    name: '测试覆盖率',
    description: '运行测试并生成覆盖率报告',
    command: 'npm run test:coverage',
    icon: '📊',
    category: '质量检查',
    subcategory: '测试',
  },
  {
    id: 'qa-test-watch',
    name: '测试监听模式',
    description: '启动测试监听模式，文件变化时自动运行',
    command: 'npm run test:watch',
    icon: '👁️',
    category: '质量检查',
    subcategory: '测试',
  },
  
  // 构建类别
  {
    id: 'build-lib',
    name: '构建库',
    description: '构建生产版本的库文件',
    command: 'npm run build',
    icon: '📦',
    category: '构建',
    subcategory: '库',
  },
  {
    id: 'build-docs',
    name: '构建文档',
    description: '构建静态文档网站',
    command: 'npm run docs:build',
    icon: '📚',
    category: '构建',
    subcategory: '文档',
  },
  {
    id: 'build-preview-docs',
    name: '预览文档',
    description: '预览构建后的文档网站',
    command: 'npm run docs:preview',
    icon: '👀',
    category: '构建',
    subcategory: '文档',
  },
  
  // 分析类别
  {
    id: 'analyze-bundle',
    name: '包大小分析',
    description: '分析构建包的大小和组成',
    command: 'tsx scripts/bundle-analyzer.ts',
    icon: '📈',
    category: '分析',
    subcategory: '性能',
  },
  {
    id: 'analyze-benchmark',
    name: '性能基准测试',
    description: '运行引擎性能基准测试',
    command: 'tsx scripts/benchmark.ts',
    icon: '⚡',
    category: '分析',
    subcategory: '性能',
  },
  {
    id: 'analyze-deps',
    name: '依赖分析',
    description: '分析项目依赖关系',
    command: 'npm run analyze:deps',
    icon: '🔗',
    category: '分析',
    subcategory: '依赖',
  },
  
  // 维护类别
  {
    id: 'maintain-clean',
    name: '清理项目',
    description: '清理构建产物、缓存和临时文件',
    command: 'tsx scripts/clean.ts',
    icon: '🧹',
    category: '维护',
    subcategory: '清理',
  },
  {
    id: 'maintain-update',
    name: '更新依赖',
    description: '更新项目依赖到最新版本',
    command: 'npm update',
    icon: '⬆️',
    category: '维护',
    subcategory: '依赖',
    requiresConfirm: true,
  },
  {
    id: 'maintain-audit',
    name: '安全审计',
    description: '检查依赖中的安全漏洞',
    command: 'npm audit',
    icon: '🔒',
    category: '维护',
    subcategory: '安全',
  },
  {
    id: 'maintain-config',
    name: '配置管理',
    description: '管理 API Token 和环境配置',
    command: 'tsx scripts/config-manager.ts',
    icon: '⚙️',
    category: '维护',
    subcategory: '配置',
  },
  
  // 发布类别
  {
    id: 'release-precheck',
    name: '发布前检查',
    description: '运行发布前的所有检查',
    command: 'npm run prerelease',
    icon: '✅',
    category: '发布',
    subcategory: '检查',
  },
  {
    id: 'release-commit',
    name: '智能提交',
    description: '运行检查并智能提交代码',
    command: 'tsx scripts/commit.ts',
    icon: '📝',
    category: '发布',
    subcategory: '版本控制',
  },
  {
    id: 'release-publish',
    name: '发布到 NPM',
    description: '发布包到 NPM 注册表',
    command: 'tsx scripts/release.ts',
    icon: '🚢',
    category: '发布',
    subcategory: '发布',
    requiresConfirm: true,
    dangerous: true,
  },
]

class InteractiveMenu {
  private selectedIndex = 0
  private selectedCategory = '全部'
  private selectedSubcategory = '全部'
  private isRunning = true
  private viewMode: 'category' | 'action' = 'category'
  
  private categories = ['全部', ...new Set(MENU_ACTIONS.map(action => action.category))]
  private categoryIndex = 0

  constructor() {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
  }

  private getSubcategories(): string[] {
    if (this.selectedCategory === '全部') {
      return ['全部', ...new Set(MENU_ACTIONS.map(action => action.subcategory).filter(Boolean) as string[])]
    }
    const subcategories = MENU_ACTIONS
      .filter(action => action.category === this.selectedCategory)
      .map(action => action.subcategory)
      .filter(Boolean) as string[]
    return ['全部', ...new Set(subcategories)]
  }

  private getFilteredActions(): MenuAction[] {
    let filtered = MENU_ACTIONS
    
    if (this.selectedCategory !== '全部') {
      filtered = filtered.filter(action => action.category === this.selectedCategory)
    }
    
    if (this.selectedSubcategory !== '全部') {
      filtered = filtered.filter(action => action.subcategory === this.selectedSubcategory)
    }
    
    return filtered
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

  private displayHeader(): void {
    console.log(chalk.magenta.bold('🎛️  @ldesign/engine 交互式管理菜单'))
    console.log(chalk.gray('功能强大的项目管理工具\n'))
  }

  private displayCategoryView(): void {
    console.clear()
    this.displayHeader()
    
    console.log(chalk.blue.bold('📂 选择类别:'))
    this.categories.forEach((category, index) => {
      const actionCount = category === '全部' 
        ? MENU_ACTIONS.length 
        : MENU_ACTIONS.filter(action => action.category === category).length
      
      if (category === this.selectedCategory) {
        console.log(chalk.bgBlue.white(`❯ ${category} (${actionCount} 项)`))
      } else {
        console.log(chalk.gray(`  ${category} (${actionCount} 项)`))
      }
    })
    
    console.log()
    console.log(chalk.gray('操作说明:'))
    console.log(chalk.gray('  ↑↓ - 选择类别'))
    console.log(chalk.gray('  Enter/→ - 进入类别'))
    console.log(chalk.gray('  Ctrl+C - 退出'))
  }

  private displayActionView(): void {
    console.clear()
    this.displayHeader()
    
    // 显示当前路径
    const breadcrumb = this.selectedSubcategory === '全部' 
      ? this.selectedCategory
      : `${this.selectedCategory} > ${this.selectedSubcategory}`
    console.log(chalk.yellow.bold(`📍 当前位置: ${breadcrumb}\n`))
    
    // 显示子类别选择（如果有）
    const subcategories = this.getSubcategories()
    if (subcategories.length > 1) {
      console.log(chalk.blue.bold('🏷️  子类别:'))
      subcategories.forEach((subcategory) => {
        if (subcategory === this.selectedSubcategory) {
          console.log(chalk.bgYellow.black(`❯ ${subcategory}`))
        } else {
          console.log(chalk.gray(`  ${subcategory}`))
        }
      })
      console.log()
    }
    
    // 显示操作列表
    const filteredActions = this.getFilteredActions()
    console.log(chalk.blue.bold('🎯 可用操作:'))
    
    if (filteredActions.length === 0) {
      console.log(chalk.gray('  暂无可用操作'))
    } else {
      filteredActions.forEach((action, index) => {
        const isSelected = index === this.selectedIndex
        const dangerIcon = action.dangerous ? chalk.red(' ⚠️') : ''
        const confirmIcon = action.requiresConfirm ? chalk.yellow(' 🔒') : ''
        
        if (isSelected) {
          console.log(chalk.bgGreen.black(`❯ ${action.icon} ${action.name}${dangerIcon}${confirmIcon}`))
          console.log(chalk.bgGreen.black(`  ${action.description}`))
          console.log(chalk.bgGreen.black(`  命令: ${action.command}`))
        } else {
          console.log(chalk.gray(`  ${action.icon} ${action.name}${dangerIcon}${confirmIcon}`))
          console.log(chalk.gray(`  ${action.description}`))
        }
        console.log()
      })
    }
    
    console.log(chalk.gray('操作说明:'))
    console.log(chalk.gray('  Tab - 切换子类别'))
    console.log(chalk.gray('  ↑↓ - 选择操作'))
    console.log(chalk.gray('  Enter - 执行操作'))
    console.log(chalk.gray('  ← - 返回类别选择'))
    console.log(chalk.gray('  Ctrl+C - 退出'))
  }

  private async confirmAction(action: MenuAction): Promise<boolean> {
    console.clear()
    this.displayHeader()
    
    if (action.dangerous) {
      console.log(chalk.red.bold('⚠️  危险操作确认\n'))
    } else {
      console.log(chalk.yellow.bold('🔒 操作确认\n'))
    }
    
    console.log(chalk.white(`操作: ${action.icon} ${action.name}`))
    console.log(chalk.white(`描述: ${action.description}`))
    console.log(chalk.white(`命令: ${action.command}`))
    console.log()
    
    if (action.dangerous) {
      console.log(chalk.red('此操作可能会产生重要影响，请谨慎确认!'))
    }
    
    console.log(chalk.yellow('确认执行此操作? (y/N)'))
    
    const key = await this.waitForKeyPress()
    return key.toLowerCase() === 'y'
  }

  private async executeCommand(command: string, actionName: string): Promise<void> {
    console.clear()
    this.displayHeader()
    console.log(chalk.blue.bold(`🚀 执行: ${actionName}`))
    console.log(chalk.gray(`命令: ${command}\n`))
    
    // 临时恢复正常模式以显示命令输出
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false)
    }

    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ')
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd(),
      })

      child.on('close', (code) => {
        console.log()
        if (code === 0) {
          console.log(chalk.green.bold('✅ 操作执行成功!'))
        } else {
          console.log(chalk.red.bold(`❌ 操作执行失败 (退出码: ${code})`))
        }
        console.log(chalk.gray('按任意键返回菜单...'))
        
        // 重新设置原始模式
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(true)
        }
        
        // 等待用户按键
        this.waitForKeyPress().then(() => resolve())
      })

      child.on('error', (error) => {
        console.log()
        console.log(chalk.red.bold(`❌ 执行错误: ${error.message}`))
        console.log(chalk.gray('按任意键返回菜单...'))
        
        // 重新设置原始模式
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(true)
        }
        
        // 等待用户按键
        this.waitForKeyPress().then(() => resolve())
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
        if (this.viewMode === 'category') {
          this.displayCategoryView()
        } else {
          this.displayActionView()
        }
        
        const key = await this.waitForKeyPress()

        if (key === KEYS.CTRL_C) {
          this.isRunning = false
          break
        }

        if (this.viewMode === 'category') {
          // 类别选择模式
          if (key === KEYS.UP) {
            this.categoryIndex = Math.max(0, this.categoryIndex - 1)
            this.selectedCategory = this.categories[this.categoryIndex]
          } else if (key === KEYS.DOWN) {
            this.categoryIndex = Math.min(this.categories.length - 1, this.categoryIndex + 1)
            this.selectedCategory = this.categories[this.categoryIndex]
          } else if (key === KEYS.ENTER || key === KEYS.RIGHT) {
            this.viewMode = 'action'
            this.selectedIndex = 0
            this.selectedSubcategory = '全部'
          }
        } else {
          // 操作选择模式
          if (key === KEYS.LEFT) {
            this.viewMode = 'category'
          } else if (key === KEYS.TAB) {
            // 切换子类别
            const subcategories = this.getSubcategories()
            if (subcategories.length > 1) {
              const currentIndex = subcategories.indexOf(this.selectedSubcategory)
              const nextIndex = (currentIndex + 1) % subcategories.length
              this.selectedSubcategory = subcategories[nextIndex]
              this.selectedIndex = 0
            }
          } else if (key === KEYS.UP) {
            const filteredActions = this.getFilteredActions()
            this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          } else if (key === KEYS.DOWN) {
            const filteredActions = this.getFilteredActions()
            this.selectedIndex = Math.min(filteredActions.length - 1, this.selectedIndex + 1)
          } else if (key === KEYS.ENTER) {
            const filteredActions = this.getFilteredActions()
            if (filteredActions.length > 0) {
              const selectedAction = filteredActions[this.selectedIndex]
              
              // 检查命令是否可用
              if (!this.checkCommandAvailability(selectedAction.command)) {
                console.clear()
                this.displayHeader()
                console.log(chalk.red.bold('❌ 命令不可用\n'))
                console.log(chalk.white(`命令: ${selectedAction.command}`))
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
              if (selectedAction.requiresConfirm) {
                const confirmed = await this.confirmAction(selectedAction)
                if (!confirmed) {
                  continue
                }
              }
              
              await this.executeCommand(selectedAction.command, selectedAction.name)
            }
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
    console.log(chalk.green.bold('👋 感谢使用 @ldesign/engine 交互式管理菜单!'))
    console.log(chalk.gray('期待下次使用 🚀'))
  }
}

// 运行交互式菜单
if (import.meta.url.includes('menu.ts') || process.argv[1]?.includes('menu.ts')) {
  const menu = new InteractiveMenu()
  menu.run().catch(console.error)
}

export { InteractiveMenu }