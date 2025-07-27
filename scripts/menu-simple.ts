#!/usr/bin/env tsx

import { spawn } from 'node:child_process'
import chalk from 'chalk'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  ENTER: '\r',
  CTRL_C: '\u0003',
}

interface SimpleMenuItem {
  name: string
  description: string
  command: string
  icon: string
}

const SIMPLE_MENU_ITEMS: SimpleMenuItem[] = [
  {
    name: '开发模式',
    description: '启动开发服务器',
    command: 'npm run dev',
    icon: '🚀',
  },
  {
    name: '构建项目',
    description: '构建生产版本',
    command: 'npm run build',
    icon: '📦',
  },
  {
    name: '运行测试',
    description: '执行所有测试',
    command: 'npm run test',
    icon: '🧪',
  },
  {
    name: '代码检查',
    description: '运行 ESLint 检查',
    command: 'npm run lint',
    icon: '🔧',
  },
  {
    name: '类型检查',
    description: '运行 TypeScript 类型检查',
    command: 'npm run type-check',
    icon: '🔍',
  },
  {
    name: '格式化代码',
    description: '使用 Prettier 格式化',
    command: 'npm run format',
    icon: '💅',
  },
  {
    name: '清理项目',
    description: '清理构建产物',
    command: 'tsx scripts/clean.ts',
    icon: '🧹',
  },
  {
    name: '配置管理',
    description: '管理环境配置',
    command: 'tsx scripts/config-manager.ts',
    icon: '⚙️',
  },
]

class SimpleMenu {
  private selectedIndex = 0
  private isRunning = true

  constructor() {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
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

    console.log(chalk.cyan.bold('⚡ @ldesign/engine 快速菜单'))
    console.log(chalk.gray('选择要执行的任务\n'))

    SIMPLE_MENU_ITEMS.forEach((item, index) => {
      const isSelected = index === this.selectedIndex

      if (isSelected) {
        console.log(chalk.bgCyan.black(`❯ ${item.icon} ${item.name}`))
        console.log(chalk.bgCyan.black(`  ${item.description}`))
      }
 else {
        console.log(chalk.gray(`  ${item.icon} ${item.name}`))
        console.log(chalk.gray(`  ${item.description}`))
      }
      console.log()
    })

    console.log(chalk.gray('(使用 ↑↓ 键选择，Enter 执行，Ctrl+C 退出)'))
  }

  private async executeCommand(command: string): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold(`🚀 执行: ${command}\n`))

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
          console.log(chalk.green.bold('✅ 执行完成!'))
        }
 else {
          console.log(chalk.red.bold(`❌ 执行失败 (退出码: ${code})`))
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

  async run(): Promise<void> {
    try {
      while (this.isRunning) {
        this.displayMenu()
        const key = await this.waitForKeyPress()

        if (key === KEYS.CTRL_C) {
          this.isRunning = false
          break
        }

        if (key === KEYS.UP) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          continue
        }

        if (key === KEYS.DOWN) {
          this.selectedIndex = Math.min(SIMPLE_MENU_ITEMS.length - 1, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER) {
          const selectedItem = SIMPLE_MENU_ITEMS[this.selectedIndex]
          await this.executeCommand(selectedItem.command)
        }
      }
    }
 finally {
      // 恢复终端设置
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
    }

    console.clear()
    console.log(chalk.green.bold('👋 再见!'))
  }
}

// 运行简单菜单
if (import.meta.url.includes('menu-simple.ts') || process.argv[1]?.includes('menu-simple.ts')) {
  const simpleMenu = new SimpleMenu()
  simpleMenu.run().catch(console.error)
}

export { SimpleMenu }
