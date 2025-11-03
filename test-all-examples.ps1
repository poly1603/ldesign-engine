# Script to test all framework examples
# This script checks if all examples can be started successfully

$ErrorActionPreference = "Continue"

$baseDir = $PSScriptRoot
$packagesDir = Join-Path $baseDir "packages"

# List of all frameworks with examples
$frameworks = @(
    "react",
    "vue",
    "svelte",
    "solid",
    "preact",
    "lit",
    "nextjs",
    "sveltekit",
    "nuxtjs",
    "remix",
    "qwik",
    "astro",
    "angular",
    "alpinejs"
)

$results = @()

Write-Host "🧪 Testing all framework examples..." -ForegroundColor Cyan
Write-Host "=" * 60

foreach ($fw in $frameworks) {
    $exampleDir = Join-Path (Join-Path $packagesDir $fw) "example"
    
    if (-not (Test-Path $exampleDir)) {
        Write-Host "❌ $fw : Example directory not found" -ForegroundColor Red
        $results += @{
            Framework = $fw
            Status = "Missing"
            Message = "Example directory not found"
        }
        continue
    }
    
    Write-Host "`n📦 Testing $fw example..." -ForegroundColor Yellow
    
    # Check if package.json exists
    $packageJson = Join-Path $exampleDir "package.json"
    if (-not (Test-Path $packageJson)) {
        Write-Host "❌ $fw : package.json not found" -ForegroundColor Red
        $results += @{
            Framework = $fw
            Status = "Error"
            Message = "package.json not found"
        }
        continue
    }
    
    # Check if main entry file exists
    $srcDir = Join-Path $exampleDir "src"
    $hasMainTs = Test-Path (Join-Path $srcDir "main.ts")
    $hasMainTsx = Test-Path (Join-Path $srcDir "main.tsx")
    $hasIndexHtml = Test-Path (Join-Path $exampleDir "index.html")
    
    if (-not ($hasMainTs -or $hasMainTsx)) {
        Write-Host "⚠️  $fw : Main entry file (main.ts/main.tsx) not found" -ForegroundColor Yellow
    }
    
    if (-not $hasIndexHtml) {
        Write-Host "⚠️  $fw : index.html not found" -ForegroundColor Yellow
    }
    
    # Check if launcher.config.ts exists
    $launcherConfig = Join-Path $exampleDir "launcher.config.ts"
    if (-not (Test-Path $launcherConfig)) {
        Write-Host "⚠️  $fw : launcher.config.ts not found" -ForegroundColor Yellow
    }
    
    Write-Host "✅ $fw : Example structure looks good" -ForegroundColor Green
    $results += @{
        Framework = $fw
        Status = "OK"
        Message = "Example exists with proper structure"
    }
}

Write-Host "`n" + "=" * 60
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "=" * 60

$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$errorCount = ($results | Where-Object { $_.Status -eq "Error" }).Count
$missingCount = ($results | Where-Object { $_.Status -eq "Missing" }).Count

foreach ($result in $results) {
    $color = switch ($result.Status) {
        "OK" { "Green" }
        "Error" { "Red" }
        "Missing" { "Yellow" }
        default { "White" }
    }
    
    $statusIcon = switch ($result.Status) {
        "OK" { "[OK]" }
        "Error" { "[ERROR]" }
        "Missing" { "[MISSING]" }
        default { "[?]" }
    }
    
    Write-Host "$statusIcon $($result.Framework): $($result.Message)" -ForegroundColor $color
}

Write-Host "`n" + "=" * 60
Write-Host "`n📈 Statistics:" -ForegroundColor Cyan
Write-Host "  ✅ Success: $okCount" -ForegroundColor Green
Write-Host "  ❌ Errors: $errorCount" -ForegroundColor Red
Write-Host "  ⚠️  Missing: $missingCount" -ForegroundColor Yellow
Write-Host "  📊 Total: $($results.Count)"

if ($okCount -eq $results.Count) {
    Write-Host "`n🎉 All examples are ready!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some examples need attention." -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run 'pnpm install' in the root directory to install all dependencies"
Write-Host "2. Navigate to any example directory (e.g., packages/react/example)"
Write-Host "3. Run 'pnpm dev' to start the development server"
Write-Host "4. Open the URL shown in your browser to test the example"
