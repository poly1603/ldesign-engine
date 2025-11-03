# Automated testing script for all framework examples
# This script starts each example, waits for it to be ready, then moves to the next

$ErrorActionPreference = "Continue"

$baseDir = $PSScriptRoot
$packagesDir = Join-Path $baseDir "packages"

# Framework configurations with expected ports
$frameworks = @(
    @{ Name = "react"; Port = 5101; DisplayName = "React" },
    @{ Name = "vue"; Port = 5100; DisplayName = "Vue" },
    @{ Name = "svelte"; Port = 5099; DisplayName = "Svelte" },
    @{ Name = "preact"; Port = 5097; DisplayName = "Preact" },
    @{ Name = "nextjs"; Port = 5102; DisplayName = "Next.js" },
    @{ Name = "sveltekit"; Port = 5103; DisplayName = "SvelteKit" },
    @{ Name = "nuxtjs"; Port = 5104; DisplayName = "Nuxt.js" },
    @{ Name = "remix"; Port = 5105; DisplayName = "Remix" },
    @{ Name = "qwik"; Port = 5106; DisplayName = "Qwik" },
    @{ Name = "astro"; Port = 5107; DisplayName = "Astro" },
    @{ Name = "angular"; Port = 5108; DisplayName = "Angular" },
    @{ Name = "alpinejs"; Port = 5109; DisplayName = "Alpine.js" }
)

$results = @()

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Starting Automated Example Tests" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

foreach ($fw in $frameworks) {
    Write-Host "`n[Testing $($fw.DisplayName)] on port $($fw.Port)" -ForegroundColor Yellow
    Write-Host "-" * 70
    
    $exampleDir = Join-Path (Join-Path $packagesDir $fw.Name) "example"
    
    if (-not (Test-Path $exampleDir)) {
        Write-Host "  [ERROR] Example directory not found" -ForegroundColor Red
        $results += @{
            Framework = $fw.DisplayName
            Status = "Missing"
            Port = $fw.Port
        }
        continue
    }
    
    # Kill any existing process on this port
    $existingProcess = netstat -ano | Select-String ":$($fw.Port) " | Select-Object -First 1
    if ($existingProcess) {
        $pid = ($existingProcess -split '\s+')[-1]
        Write-Host "  Killing existing process on port $($fw.Port) (PID: $pid)" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Start the dev server
    Write-Host "  Starting dev server..." -ForegroundColor Gray
    $job = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        pnpm dev 2>&1
    } -ArgumentList $exampleDir
    
    # Wait for server to start (max 30 seconds)
    $timeout = 30
    $elapsed = 0
    $serverReady = $false
    
    Write-Host "  Waiting for server to start (timeout: ${timeout}s)..." -ForegroundColor Gray
    
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        
        # Check if port is listening
        $listening = netstat -ano | Select-String ":$($fw.Port) .*LISTENING"
        if ($listening) {
            $serverReady = $true
            Write-Host "  [SUCCESS] Server started on port $($fw.Port) in ${elapsed}s" -ForegroundColor Green
            break
        }
        
        # Check if job failed
        if ($job.State -eq "Failed" -or $job.State -eq "Stopped") {
            Write-Host "  [ERROR] Server failed to start" -ForegroundColor Red
            $jobOutput = Receive-Job -Job $job 2>&1 | Out-String
            Write-Host "  Output: $($jobOutput.Substring(0, [Math]::Min(200, $jobOutput.Length)))" -ForegroundColor Red
            break
        }
        
        Write-Host "  Still waiting... (${elapsed}s elapsed)" -ForegroundColor Gray
    }
    
    if ($serverReady) {
        # Try to make a simple HTTP request
        try {
            Write-Host "  Testing HTTP connection..." -ForegroundColor Gray
            $response = Invoke-WebRequest -Uri "http://localhost:$($fw.Port)" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "  [SUCCESS] HTTP 200 OK - Page loads successfully!" -ForegroundColor Green
                $results += @{
                    Framework = $fw.DisplayName
                    Status = "Success"
                    Port = $fw.Port
                    Time = "${elapsed}s"
                }
            } else {
                Write-Host "  [WARNING] HTTP $($response.StatusCode)" -ForegroundColor Yellow
                $results += @{
                    Framework = $fw.DisplayName
                    Status = "Partial"
                    Port = $fw.Port
                    Time = "${elapsed}s"
                }
            }
        } catch {
            Write-Host "  [WARNING] HTTP request failed: $($_.Exception.Message)" -ForegroundColor Yellow
            $results += @{
                Framework = $fw.DisplayName
                Status = "HTTP Error"
                Port = $fw.Port
                Time = "${elapsed}s"
            }
        }
    } else {
        Write-Host "  [FAILED] Server did not start within ${timeout}s" -ForegroundColor Red
        $results += @{
            Framework = $fw.DisplayName
            Status = "Timeout"
            Port = $fw.Port
        }
    }
    
    # Stop the job
    Write-Host "  Stopping server..." -ForegroundColor Gray
    Stop-Job -Job $job -ErrorAction SilentlyContinue
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    
    # Kill the process on the port
    $process = netstat -ano | Select-String ":$($fw.Port) " | Select-Object -First 1
    if ($process) {
        $pid = ($process -split '\s+')[-1]
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.Status -eq "Success" }).Count
$failedCount = ($results | Where-Object { $_.Status -ne "Success" -and $_.Status -ne "Partial" }).Count
$partialCount = ($results | Where-Object { $_.Status -eq "Partial" }).Count

foreach ($result in $results) {
    $statusColor = switch ($result.Status) {
        "Success" { "Green" }
        "Partial" { "Yellow" }
        default { "Red" }
    }
    
    $statusIcon = switch ($result.Status) {
        "Success" { "[OK]" }
        "Partial" { "[WARN]" }
        default { "[FAIL]" }
    }
    
    $timeInfo = if ($result.Time) { " (${($result.Time)})" } else { "" }
    Write-Host "$statusIcon $($result.Framework) - Port $($result.Port)$timeInfo - $($result.Status)" -ForegroundColor $statusColor
}

Write-Host "`n" -NoNewline
Write-Host "Statistics:" -ForegroundColor Cyan
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Partial: $partialCount" -ForegroundColor Yellow
Write-Host "  Failed: $failedCount" -ForegroundColor Red
Write-Host "  Total: $($results.Count)"

if ($successCount -eq $results.Count) {
    Write-Host "`n[SUCCESS] All examples tested successfully!" -ForegroundColor Green
} elseif ($successCount + $partialCount -eq $results.Count) {
    Write-Host "`n[PARTIAL] All examples started, some with warnings" -ForegroundColor Yellow
} else {
    Write-Host "`n[ATTENTION] Some examples failed to start" -ForegroundColor Yellow
}

Write-Host "`nTo manually test an example:" -ForegroundColor Cyan
Write-Host "  cd packages\engine\packages\[framework]\example"
Write-Host "  pnpm dev"
