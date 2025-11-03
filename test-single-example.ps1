# 测试单个框架 Example 的启动脚本
param(
    [Parameter(Mandatory=$true)]
    [string]$Framework
)

$examplePath = "packages\$Framework\example"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试框架: $Framework" -ForegroundColor Cyan
Write-Host "路径: $examplePath" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

if (-not (Test-Path $examplePath)) {
    Write-Host "❌ 目录不存在: $examplePath" -ForegroundColor Red
    exit 1
}

Set-Location $examplePath
Write-Host "🚀 启动开发服务器..." -ForegroundColor Cyan
Write-Host "执行命令: pnpm dev`n" -ForegroundColor Gray

pnpm dev

