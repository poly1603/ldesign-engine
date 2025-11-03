# Fix package.json files for all new examples
$ErrorActionPreference = "Stop"

$baseDir = $PSScriptRoot
$packagesDir = Join-Path $baseDir "packages"

$frameworks = @(
    @{ Name = "nextjs"; DisplayName = "Next.js" },
    @{ Name = "sveltekit"; DisplayName = "SvelteKit" },
    @{ Name = "nuxtjs"; DisplayName = "Nuxt.js" },
    @{ Name = "remix"; DisplayName = "Remix" },
    @{ Name = "qwik"; DisplayName = "Qwik" },
    @{ Name = "astro"; DisplayName = "Astro" },
    @{ Name = "angular"; DisplayName = "Angular" },
    @{ Name = "alpinejs"; DisplayName = "Alpine.js" }
)

foreach ($fw in $frameworks) {
    $exampleDir = Join-Path (Join-Path $packagesDir $fw.Name) "example"
    $packageJsonPath = Join-Path $exampleDir "package.json"
    
    if (Test-Path $packageJsonPath) {
        Write-Host "Fixing $($fw.DisplayName) package.json..." -ForegroundColor Cyan
        
        # Create proper JSON content
        $content = @{
            name = "@ldesign/engine-$($fw.Name)-example"
            version = "0.2.0"
            type = "module"
            private = $true
            description = "$($fw.DisplayName) Engine example project - Demonstrates createEngineApp usage"
            scripts = @{
                dev = "launcher dev"
                build = "launcher build"
                preview = "launcher preview"
            }
            dependencies = @{
                "@ldesign/engine-core" = "workspace:*"
                "@ldesign/engine-$($fw.Name)" = "workspace:*"
            }
            devDependencies = @{
                "@ldesign/launcher" = "workspace:*"
                typescript = "^5.3.0"
                vite = "^5.0.0"
            }
        }
        
        # Convert to JSON and save
        $jsonContent = $content | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($packageJsonPath, $jsonContent, [System.Text.Encoding]::UTF8)
        
        Write-Host "  Fixed $($fw.Name)" -ForegroundColor Green
    }
}

Write-Host "`nAll package.json files fixed!" -ForegroundColor Green
