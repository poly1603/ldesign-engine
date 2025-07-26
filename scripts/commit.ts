#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import chalk from 'chalk'
import ora from 'ora'

interface CommitOptions {
  skipChecks?: boolean
  help?: boolean
}

class GitCommitManager {
  private rootDir = process.cwd()

  // 检查是否在 Git 仓库中
  private checkGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  // 检查工作区状态
  private checkWorkingDirectory(): { hasChanges: boolean; files: string[] } {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf8' })
      const files = output.trim().split('\n').filter(line => line.trim())
      return {
        hasChanges: files.length > 0,
        files: files.map(line => line.substring(3))
      }
    } catch {
      return { hasChanges: false, files: [] }
    }
  }

  // 检查当前分支
  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }

  // 运行 TypeScript 类型检查
  private async runTypeCheck(): Promise<boolean> {
    const spinner = ora('🔍 运行 TypeScript 类型检查...').start()
    
    try {
      execSync('pnpm typecheck', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ TypeScript 类型检查通过'))
      return true
    } catch {
      spinner.fail(chalk.red('❌ TypeScript 类型检查失败'))
      return false
    }
  }

  // 运行 ESLint 检查
  private async runLintCheck(): Promise<boolean> {
    const spinner = ora('🔍 运行 ESLint 检查...').start()
    
    try {
      execSync('pnpm lint', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ ESLint 检查通过'))
      return true
    } catch {
      spinner.fail(chalk.red('❌ ESLint 检查失败'))
      console.log(chalk.yellow('💡 提示: 运行 `pnpm lint:fix` 自动修复问题'))
      return false
    }
  }

  // 运行测试
  private async runTests(): Promise<boolean> {
    const spinner = ora('🧪 运行测试用例...').start()
    
    try {
      execSync('pnpm test:run', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ 所有测试通过'))
      return true
    } catch {
      spinner.fail(chalk.red('❌ 测试失败'))
      return false
    }
  }

  // 运行构建
  private async runBuild(): Promise<boolean> {
    const spinner = ora('📦 运行项目构建...').start()
    
    try {
      execSync('pnpm build', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ 项目构建成功'))
      return true
    } catch {
      spinner.fail(chalk.red('❌ 项目构建失败'))
      return false
    }
  }

  // 运行文档构建
  private async runDocsBuild(): Promise<boolean> {
    const spinner = ora('📚 运行文档构建...').start()
    
    try {
      execSync('pnpm docs:build', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ 文档构建成功'))
      return true
    } catch {
      spinner.fail(chalk.red('❌ 文档构建失败'))
      return false
    }
  }

  // 运行所有检查
  private async runAllChecks(): Promise<boolean> {
    console.log(chalk.blue.bold('🔍 运行代码质量检查...\n'))

    const checks = [
      { name: 'TypeScript 类型检查', fn: () => this.runTypeCheck() },
      { name: 'ESLint 代码规范检查', fn: () => this.runLintCheck() },
      { name: '测试用例', fn: () => this.runTests() },
      { name: '项目构建', fn: () => this.runBuild() },
      { name: '文档构建', fn: () => this.runDocsBuild() },
    ]

    for (const check of checks) {
      const success = await check.fn()
      if (!success) {
        console.log(chalk.red(`\n❌ ${check.name} 失败，请修复后重试`))
        return false
      }
    }

    console.log(chalk.green.bold('\n✅ 所有检查通过!'))
    return true
  }

  // Git 操作：暂存文件
  private stageFiles(files: string[]): void {
    const spinner = ora('📝 暂存文件...').start()
    
    try {
      execSync('git add .', { stdio: 'ignore' })
      spinner.succeed(chalk.green(`✅ 已暂存 ${files.length} 个文件`))
    } catch (error) {
      spinner.fail(chalk.red('❌ 暂存文件失败'))
      throw error
    }
  }

  // Git 操作：拉取最新代码
  private pullLatestChanges(): void {
    const spinner = ora('⬇️  拉取最新代码...').start()
    
    try {
      execSync('git pull --rebase', { stdio: 'ignore' })
      spinner.succeed(chalk.green('✅ 已拉取最新代码'))
    } catch (error) {
      spinner.fail(chalk.red('❌ 拉取代码失败'))
      throw error
    }
  }

  // Git 操作：恢复暂存
  private restoreStaged(): void {
    try {
      execSync('git restore --staged .', { stdio: 'ignore' })
    } catch {
      // 忽略错误
    }
  }

  // 交互式提交
  private async interactiveCommit(): Promise<void> {
    console.log(chalk.blue.bold('\n📝 交互式提交\n'))
    
    // 显示提交类型选项
    console.log(chalk.yellow('选择提交类型:'))
    const commitTypes = [
      { key: '1', type: 'feat', desc: '新功能' },
      { key: '2', type: 'fix', desc: '修复 bug' },
      { key: '3', type: 'docs', desc: '文档更新' },
      { key: '4', type: 'style', desc: '代码格式调整' },
      { key: '5', type: 'refactor', desc: '重构代码' },
      { key: '6', type: 'perf', desc: '性能优化' },
      { key: '7', type: 'test', desc: '测试相关' },
      { key: '8', type: 'chore', desc: '构建过程或辅助工具的变动' },
    ]

    commitTypes.forEach(({ key, type, desc }) => {
      console.log(chalk.white(`  ${key}. ${type}: ${desc}`))
    })

    // 这里简化处理，实际项目中可以使用 inquirer 等库进行交互
    console.log(chalk.gray('\n💡 提示: 请手动运行 `git commit` 完成提交'))
    console.log(chalk.gray('格式: type(scope): description'))
    console.log(chalk.gray('示例: feat(engine): add new plugin system'))
  }

  // 显示帮助信息
  private showHelp(): void {
    console.log(chalk.blue.bold('📝 @ldesign/engine Git 提交工具\n'))
    console.log(chalk.yellow('用法:'))
    console.log(chalk.white('  pnpm commit              # 完整的提交流程'))
    console.log(chalk.white('  pnpm commit --skip-checks # 跳过代码检查'))
    console.log(chalk.white('  pnpm commit --help        # 显示帮助信息'))
    console.log()
    console.log(chalk.yellow('提交流程:'))
    console.log(chalk.white('  1. 🔍 检查 Git 仓库状态'))
    console.log(chalk.white('  2. 🔍 运行 TypeScript 类型检查'))
    console.log(chalk.white('  3. 🔍 运行 ESLint 代码规范检查'))
    console.log(chalk.white('  4. 🧪 运行测试用例'))
    console.log(chalk.white('  5. 📦 运行项目构建'))
    console.log(chalk.white('  6. 📚 运行文档构建'))
    console.log(chalk.white('  7. 📝 暂存文件'))
    console.log(chalk.white('  8. ⬇️  拉取最新代码'))
    console.log(chalk.white('  9. 📝 交互式提交'))
    console.log()
    console.log(chalk.yellow('提交信息格式 (Conventional Commits):'))
    console.log(chalk.white('  type(scope): description'))
    console.log(chalk.white('  feat(engine): add new plugin system'))
    console.log(chalk.white('  fix(middleware): resolve execution order issue'))
  }

  // 解析命令行参数
  private parseArgs(): CommitOptions {
    const args = process.argv.slice(2)
    return {
      skipChecks: args.includes('--skip-checks'),
      help: args.includes('--help') || args.includes('-h'),
    }
  }

  // 运行提交流程
  async run(): Promise<void> {
    const options = this.parseArgs()

    if (options.help) {
      this.showHelp()
      return
    }

    console.log(chalk.blue.bold('📝 @ldesign/engine 智能提交流程\n'))

    try {
      // 1. 检查 Git 仓库
      if (!this.checkGitRepository()) {
        console.log(chalk.red('❌ 当前目录不是 Git 仓库'))
        process.exit(1)
      }

      // 2. 检查工作区状态
      const { hasChanges, files } = this.checkWorkingDirectory()
      if (!hasChanges) {
        console.log(chalk.yellow('⚠️  工作区没有变更，无需提交'))
        return
      }

      console.log(chalk.blue(`📁 当前分支: ${this.getCurrentBranch()}`))
      console.log(chalk.blue(`📝 发现 ${files.length} 个变更文件\n`))

      // 3. 运行代码检查（除非跳过）
      if (!options.skipChecks) {
        const checksPass = await this.runAllChecks()
        if (!checksPass) {
          console.log(chalk.red('\n❌ 代码检查失败，请修复后重试'))
          console.log(chalk.yellow('💡 提示: 使用 --skip-checks 跳过检查（不推荐）'))
          process.exit(1)
        }
      } else {
        console.log(chalk.yellow('⚠️  跳过代码检查'))
      }

      // 4. Git 操作
      console.log(chalk.blue.bold('\n📝 执行 Git 操作...\n'))
      
      this.stageFiles(files)
      this.pullLatestChanges()
      
      // 5. 交互式提交
      await this.interactiveCommit()
      
      console.log(chalk.green.bold('\n✅ 提交准备完成!'))
      console.log(chalk.yellow('💡 请运行 `git commit -m "your message"` 完成提交'))
      
    } catch (error) {
      console.error(chalk.red('❌ 提交过程中发生错误:'), error)
      
      // 恢复暂存状态
      this.restoreStaged()
      console.log(chalk.yellow('🔄 已恢复暂存状态'))
      
      process.exit(1)
    }
  }
}

// 运行提交流程
if (import.meta.url.includes('commit.ts') || process.argv[1]?.includes('commit.ts')) {
  const commitManager = new GitCommitManager()
  commitManager.run().catch(console.error)
}

export { GitCommitManager }