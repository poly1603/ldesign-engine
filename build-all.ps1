# 批量构建所有 Engine 包

$frameworks = @('react', 'vue3', 'solid', 'svelte', 'lit', 'preact', 'qwik', 'angular', 'vue2')

Write-Host "开始构建所有 Engine 包..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0
$results = @()

foreach ($framework in $frameworks) {
    $packageName = "@ldesign/engine-$framework"
    Write-Host "[$($frameworks.IndexOf($framework) + 1)/$($frameworks.Count)] 构建 $packageName..." -ForegroundColor Yellow
    
    $startTime = Get-Date
    
    try {
        pnpm --filter=$packageName run build 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            $duration = ((Get-Date) - $startTime).TotalSeconds
            Write-Host "  ✓ 成功 (耗时: $([math]::Round($duration, 2))s)" -ForegroundColor Green
            $successCount++
            $results += @{ framework = $framework; status = 'success'; duration = $duration }
        } else {
            Write-Host "  ✗ 失败" -ForegroundColor Red
            $failCount++
            $results += @{ framework = $framework; status = 'failed'; duration = 0 }
        }
    } catch {
        Write-Host "  ✗ 失败: $_" -ForegroundColor Red
        $failCount++
        $results += @{ framework = $framework; status = 'failed'; duration = 0 }
    }
    
    Write-Host ""
}

Write-Host "==================== 构建总结 ====================" -ForegroundColor Cyan
Write-Host "成功: $successCount" -ForegroundColor Green
Write-Host "失败: $failCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "成功的包:" -ForegroundColor Green
    foreach ($result in $results) {
        if ($result.status -eq 'success') {
            Write-Host "  ✓ engine-$($result.framework) ($([math]::Round($result.duration, 2))s)" -ForegroundColor Green
        }
    }
}

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "失败的包:" -ForegroundColor Red
    foreach ($result in $results) {
        if ($result.status -eq 'failed') {
            Write-Host "  ✗ engine-$($result.framework)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "完成!" -ForegroundColor Cyan

