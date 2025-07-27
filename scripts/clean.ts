#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'

interface CleanOptions {
  includeDeps?: boolean
  help?: boolean
}

interface CleanItem {
  path: string
  name: string
}

class ProjectCleaner {
  private rootDir = process.cwd()
  private cleanedItems: string[] = []

  // 删除文件或目录
  private removeItem(itemPath: string, description: string): boolean {
    try {
      if (fs.existsSync(itemPath)) {
        const stats = fs.statSync(itemPath)

        if (stats.isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true })
        }
 else {
          fs.unlinkSync(itemPath)
        }

        this.cleanedItems.push(description)
        console.log(chalk.green(`✅ 已删除: ${description}`))
        return true
      }
 else {
        console.log(chalk.gray(`⏭️  跳过: ${description} (不存在)`))
        return false
      }
    }
 catch (error) {
      console.log(chalk.red(`❌ 删除失败: ${description} - ${(error as Error).message}`))
      return false
    }
  }

  // 获取目录大小
  private getDirectorySize(dirPath: string): number {
    let totalSize = 0

    const calculateSize = (currentPath: string): void => {
      try {
        const stats = fs.statSync(currentPath)

        if (stats.isDirectory()) {
          const files = fs.readdirSync(currentPath)
          files.forEach((file) => {
            calculateSize(path.join(currentPath, file))
          })
        }
 else {
          totalSize += stats.size
        }
      }
 catch {
        // 忽略无法访问的文件
      }
    }

    if (fs.existsSync(dirPath)) {
      calculateSize(dirPath)
    }

    return totalSize
  }

  // 格式化文件大小
  private formatSize(bytes: number): string {
    if (bytes === 0)
return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  // 清理构建产物
  private cleanBuildArtifacts(): void {
    console.log(chalk.blue('🧹 清理 @ldesign/engine 构建产物...'))

    const buildDirs: CleanItem[] = [
      { path: 'dist', name: '构建输出 (dist)' },
      { path: 'lib', name: 'CommonJS 输出 (lib)' },
      { path: 'es', name: 'ESM 输出 (es)' },
      { path: 'types', name: 'TypeScript 声明 (types)' },
    ]

    buildDirs.forEach(({ path: dirPath, name }) => {
      this.removeItem(path.join(this.rootDir, dirPath), name)
    })
  }

  // 清理文档构建产物
  private cleanDocsArtifacts(): void {
    console.log(chalk.blue('\n📚 清理文档构建产物...'))

    const docsPaths: CleanItem[] = [
      { path: 'docs/.vitepress/dist', name: '文档构建输出' },
      { path: 'docs/.vitepress/cache', name: '文档缓存' },
    ]

    docsPaths.forEach(({ path: dirPath, name }) => {
      this.removeItem(path.join(this.rootDir, dirPath), name)
    })
  }

  // 清理测试产物
  private cleanTestArtifacts(): void {
    console.log(chalk.blue('\n🧪 清理测试产物...'))

    const testPaths: CleanItem[] = [
      { path: 'coverage', name: '测试覆盖率报告' },
      { path: '.nyc_output', name: 'NYC 输出' },
      { path: 'test-results.xml', name: '测试结果 XML' },
      { path: 'junit.xml', name: 'JUnit 报告' },
    ]

    testPaths.forEach(({ path: filePath, name }) => {
      this.removeItem(path.join(this.rootDir, filePath), name)
    })
  }

  // 清理缓存文件
  private cleanCacheFiles(): void {
    console.log(chalk.blue('\n💾 清理缓存文件...'))

    const cachePaths: CleanItem[] = [
      { path: '.eslintcache', name: 'ESLint 缓存' },
      { path: '.tsbuildinfo', name: 'TypeScript 构建信息' },
      { path: 'tsconfig.tsbuildinfo', name: 'TypeScript 构建信息' },
      { path: '.vite', name: 'Vite 缓存' },
      { path: 'node_modules/.cache', name: 'Node modules 缓存' },
    ]

    cachePaths.forEach(({ path: filePath, name }) => {
      this.removeItem(path.join(this.rootDir, filePath), name)
    })
  }

  // 清理临时文件
  private cleanTempFiles(): void {
    console.log(chalk.blue('\n🗑️  清理临时文件...'))

    const tempFiles = [
      'benchmark-results.json',
      'bundle-analysis.json',
      '.DS_Store',
      'Thumbs.db',
    ]

    // 清理日志文件和包文件
    const files = fs.readdirSync(this.rootDir)
    files.forEach((file) => {
      if (file.endsWith('.log') || file.endsWith('.tgz')) {
        this.removeItem(path.join(this.rootDir, file), `临时文件 (${file})`)
      }
    })

    // 清理其他临时文件
    tempFiles.forEach((file) => {
      this.removeItem(path.join(this.rootDir, file), file)
    })
  }

  // 清理依赖
  private cleanDependencies(): void {
    console.log(chalk.blue('\n📦 清理依赖...'))

    const depPaths: CleanItem[] = [
      { path: 'node_modules', name: 'Node modules' },
      { path: 'pnpm-lock.yaml', name: 'PNPM 锁文件' },
      { path: 'package-lock.json', name: 'NPM 锁文件' },
      { path: 'yarn.lock', name: 'Yarn 锁文件' },
    ]

    depPaths.forEach(({ path: filePath, name }) => {
      this.removeItem(path.join(this.rootDir, filePath), name)
    })
  }

  // 计算清理前的总大小
  private calculateTotalSize(): number {
    const paths = [
      'dist',
      'lib',
      'es',
      'types',
      'docs/.vitepress/dist',
      'docs/.vitepress/cache',
      'coverage',
      '.eslintcache',
      '.vite',
      'node_modules/.cache',
    ]

    let totalSize = 0
    paths.forEach((dirPath) => {
      const fullPath = path.join(this.rootDir, dirPath)
      totalSize += this.getDirectorySize(fullPath)
    })

    return totalSize
  }

  // 显示帮助信息
  private showHelp(): void {
    console.log(chalk.blue.bold('🧹 @ldesign/engine 项目清理工具\n'))
    console.log(chalk.yellow('用法:'))
    console.log(chalk.white('  pnpm clean              # 清理构建产物和缓存'))
    console.log(chalk.white('  pnpm clean --deps       # 深度清理（包括 node_modules）'))
    console.log(chalk.white('  pnpm clean --help       # 显示帮助信息'))
    console.log()
    console.log(chalk.yellow('清理内容:'))
    console.log(chalk.white('  📦 构建产物: dist/, lib/, es/, types/'))
    console.log(chalk.white('  📚 文档产物: docs/.vitepress/dist, docs/.vitepress/cache'))
    console.log(chalk.white('  🧪 测试产物: coverage/, test-results.xml'))
    console.log(chalk.white('  💾 缓存文件: .eslintcache, .vite, node_modules/.cache'))
    console.log(chalk.white('  🗑️  临时文件: *.log, *.tgz, benchmark-results.json'))
    console.log(chalk.white('  📦 依赖文件: node_modules/, pnpm-lock.yaml (仅 --deps)'))
  }

  // 解析命令行参数
  private parseArgs(): CleanOptions {
    const args = process.argv.slice(2)
    return {
      includeDeps: args.includes('--deps'),
      help: args.includes('--help') || args.includes('-h'),
    }
  }

  // 运行清理
  async run(): Promise<void> {
    const options = this.parseArgs()

    if (options.help) {
      this.showHelp()
      return
    }

    console.log(chalk.blue.bold('🧹 开始清理 @ldesign/engine 项目\n'))

    // 计算清理前的大小
    const sizeBefore = this.calculateTotalSize()
    console.log(chalk.gray(`清理前大小: ${this.formatSize(sizeBefore)}\n`))

    try {
      // 基础清理
      this.cleanBuildArtifacts()
      this.cleanDocsArtifacts()
      this.cleanTestArtifacts()
      this.cleanCacheFiles()
      this.cleanTempFiles()

      // 深度清理
      if (options.includeDeps) {
        this.cleanDependencies()
      }

      // 计算清理后的大小
      const sizeAfter = this.calculateTotalSize()
      const savedSize = sizeBefore - sizeAfter

      console.log(chalk.green.bold('\n✅ 清理完成!'))
      console.log(chalk.white(`清理项目: ${this.cleanedItems.length} 项`))
      console.log(chalk.white(`节省空间: ${this.formatSize(savedSize)}`))

      if (options.includeDeps) {
        console.log(chalk.yellow('\n💡 提示: 运行 `pnpm install` 重新安装依赖'))
      }

      console.log(chalk.yellow('\n💡 提示: 运行 `pnpm build` 重新构建项目'))
    }
 catch (error) {
      console.error(chalk.red('❌ 清理过程中发生错误:'), error)
      process.exit(1)
    }
  }
}

// 运行清理
if (import.meta.url.includes('clean.ts') || process.argv[1]?.includes('clean.ts')) {
  const cleaner = new ProjectCleaner()
  cleaner.run().catch(console.error)
}

export { ProjectCleaner }
