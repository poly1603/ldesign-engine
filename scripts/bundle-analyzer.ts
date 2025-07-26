#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import chalk from 'chalk'

interface FileAnalysis {
  name: string
  path: string
  size: number
  gzipSize: number
  sizeFormatted: string
  gzipSizeFormatted: string
  compressionRatio: number
}

interface BundleResult {
  name: string
  totalSize: number
  totalGzipSize: number
  totalSizeFormatted: string
  totalGzipSizeFormatted: string
  fileCount: number
}

interface BundleReport {
  timestamp: string
  nodeVersion: string
  results: Record<string, BundleResult>
  summary: {
    totalFiles: number
    totalSize: number
    totalGzipSize: number
    totalSizeFormatted: string
    totalGzipSizeFormatted: string
  }
}

interface SizeLimit {
  max: number
  name: string
}

class BundleAnalyzer {
  private results: Record<string, BundleResult> = {}

  // 获取文件大小
  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath)
      return stats.size
    }
 catch {
      return 0
    }
  }

  // 获取 Gzip 压缩后的大小
  private getGzipSize(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath)
      const compressed = gzipSync(content)
      return compressed.length
    }
 catch {
      return 0
    }
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

  // 分析单个文件
  private analyzeFile(filePath: string, name: string): FileAnalysis {
    const size = this.getFileSize(filePath)
    const gzipSize = this.getGzipSize(filePath)

    return {
      name,
      path: filePath,
      size,
      gzipSize,
      sizeFormatted: this.formatSize(size),
      gzipSizeFormatted: this.formatSize(gzipSize),
      compressionRatio: size > 0 ? Math.round((1 - gzipSize / size) * 100) : 0,
    }
  }

  // 分析构建输出
  private analyzeBuildOutput(): void {
    const buildDirs = [
      { dir: 'es', name: 'ESM' },
      { dir: 'lib', name: 'CommonJS' },
      { dir: 'dist', name: 'UMD' },
      { dir: 'types', name: 'TypeScript Declarations' },
    ]

    console.log(chalk.blue.bold('📦 分析 @ldesign/engine 构建输出...\n'))

    buildDirs.forEach(({ dir, name }) => {
      const dirPath = path.join(process.cwd(), dir)

      if (!fs.existsSync(dirPath)) {
        console.log(chalk.yellow(`⚠️  ${name} 目录不存在: ${dir}`))
        return
      }

      console.log(chalk.cyan(`📁 ${name} (${dir}/)`))

      const files = this.getFilesRecursively(dirPath)
      let totalSize = 0
      let totalGzipSize = 0

      files.forEach((file) => {
        const relativePath = path.relative(dirPath, file)
        const analysis = this.analyzeFile(file, relativePath)

        totalSize += analysis.size
        totalGzipSize += analysis.gzipSize

        if (analysis.size > 0) {
          console.log(chalk.white(`   ${analysis.name}`))
          console.log(chalk.gray(`     原始大小: ${analysis.sizeFormatted}`))
          console.log(
            chalk.gray(
              `     Gzip 大小: ${analysis.gzipSizeFormatted} (${analysis.compressionRatio}% 压缩)`,
            ),
          )
        }
      })

      this.results[dir] = {
        name,
        totalSize,
        totalGzipSize,
        totalSizeFormatted: this.formatSize(totalSize),
        totalGzipSizeFormatted: this.formatSize(totalGzipSize),
        fileCount: files.length,
      }

      console.log(
        chalk.green(
          `   总计: ${this.formatSize(totalSize)} (Gzip: ${this.formatSize(totalGzipSize)})`,
        ),
      )
      console.log()
    })
  }

  // 递归获取目录下的所有文件
  private getFilesRecursively(dir: string): string[] {
    const files: string[] = []

    const traverse = (currentDir: string): void => {
      const items = fs.readdirSync(currentDir)

      items.forEach((item) => {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          traverse(fullPath)
        }
 else {
          files.push(fullPath)
        }
      })
    }

    traverse(dir)
    return files
  }

  // 检查包大小限制
  private checkSizeLimits(): boolean {
    console.log(chalk.blue.bold('🚨 检查 @ldesign/engine 包大小限制...\n'))

    const limits: Record<string, SizeLimit> = {
      es: { max: 150 * 1024, name: 'ESM Bundle' }, // 150KB
      lib: { max: 150 * 1024, name: 'CommonJS Bundle' }, // 150KB
      dist: { max: 200 * 1024, name: 'UMD Bundle' }, // 200KB
    }

    let hasWarnings = false

    Object.entries(limits).forEach(([dir, limit]) => {
      const result = this.results[dir]

      if (!result) {
        console.log(chalk.yellow(`⚠️  ${limit.name}: 构建输出不存在`))
        return
      }

      const percentage = Math.round((result.totalGzipSize / limit.max) * 100)
      const status = result.totalGzipSize > limit.max ? '❌' : percentage > 80 ? '⚠️' : '✅'
      const color = result.totalGzipSize > limit.max ? chalk.red : percentage > 80 ? chalk.yellow : chalk.green

      console.log(
        `${status} ${limit.name}: ${color(
          `${result.totalGzipSizeFormatted} / ${this.formatSize(limit.max)} (${percentage}%)`
        )}`
      )

      if (result.totalGzipSize > limit.max) {
        hasWarnings = true
        console.log(chalk.red(`   超出限制 ${this.formatSize(result.totalGzipSize - limit.max)}`))
      } else if (percentage > 80) {
        hasWarnings = true
        console.log(chalk.yellow(`   接近限制，建议优化`))
      }
    })

    console.log()
    return !hasWarnings
  }

  // 生成优化建议
  private generateOptimizationSuggestions(): void {
    console.log(chalk.blue.bold('💡 优化建议:\n'))

    const suggestions = [
      '🔍 检查是否有未使用的依赖项',
      '📦 考虑使用 Tree Shaking 移除未使用的代码',
      '🗜️  启用更激进的压缩选项',
      '📝 检查 TypeScript 声明文件是否过大',
      '🔧 考虑拆分大型功能模块',
      '📊 使用 webpack-bundle-analyzer 进行详细分析',
    ]

    suggestions.forEach((suggestion) => {
      console.log(chalk.white(`   ${suggestion}`))
    })
    console.log()
  }

  // 生成报告
  private generateReport(): BundleReport {
    const allResults = Object.values(this.results)
    const totalFiles = allResults.reduce((sum, result) => sum + result.fileCount, 0)
    const totalSize = allResults.reduce((sum, result) => sum + result.totalSize, 0)
    const totalGzipSize = allResults.reduce((sum, result) => sum + result.totalGzipSize, 0)

    return {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      results: this.results,
      summary: {
        totalFiles,
        totalSize,
        totalGzipSize,
        totalSizeFormatted: this.formatSize(totalSize),
        totalGzipSizeFormatted: this.formatSize(totalGzipSize),
      },
    }
  }

  // 保存报告
  private saveReport(report: BundleReport): void {
    const reportPath = path.join(process.cwd(), 'bundle-analysis.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(chalk.green(`💾 分析报告已保存到: ${reportPath}`))
  }

  // 显示总结
  private displaySummary(report: BundleReport): void {
    console.log(chalk.blue.bold('📋 总结报告:'))
    console.log(chalk.gray(`时间: ${new Date(report.timestamp).toLocaleString()}`))
    console.log(chalk.gray(`Node.js: ${report.nodeVersion}`))
    console.log()

    console.log(chalk.yellow('📊 整体统计:'))
    console.log(chalk.white(`   文件总数: ${report.summary.totalFiles}`))
    console.log(chalk.white(`   原始大小: ${report.summary.totalSizeFormatted}`))
    console.log(chalk.white(`   Gzip 大小: ${report.summary.totalGzipSizeFormatted}`))
    
    const compressionRatio = report.summary.totalSize > 0 
      ? Math.round((1 - report.summary.totalGzipSize / report.summary.totalSize) * 100)
      : 0
    console.log(chalk.white(`   压缩比例: ${compressionRatio}%`))
    console.log()
  }

  // 运行分析
  async run(): Promise<void> {
    console.log(chalk.blue.bold('🔍 @ldesign/engine Bundle 大小分析\n'))

    try {
      this.analyzeBuildOutput()
      const isWithinLimits = this.checkSizeLimits()
      
      if (!isWithinLimits) {
        this.generateOptimizationSuggestions()
      }

      const report = this.generateReport()
      this.displaySummary(report)
      this.saveReport(report)

      console.log(chalk.green.bold('✅ Bundle 分析完成!'))
      
      if (!isWithinLimits) {
        console.log(chalk.yellow('⚠️  发现大小限制警告，请查看上述建议'))
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red('❌ Bundle 分析失败:'), error)
      process.exit(1)
    }
  }
}

// 运行分析
if (import.meta.url.includes('bundle-analyzer.ts') || process.argv[1]?.includes('bundle-analyzer.ts')) {
  const analyzer = new BundleAnalyzer()
  analyzer.run().catch(console.error)
}

export { BundleAnalyzer }