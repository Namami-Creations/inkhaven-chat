# Delete Bloat Files - Production Cleanup
# Based on RUTHLESS_PROJECT_ANALYSIS.md findings

$bloatFiles = @(
    # Duplicate/Old Components
    "components\ThemeSelector.tsx",  # OLD - using MoodThemeSelector now
    
    # Unused Libraries
    "lib\logger-edge.ts",
    "lib\language-preferences.ts",
    "lib\security\auth-manager.ts",
    "lib\security\rate-limiter.ts",
    "lib\analytics\tracking.ts",
    "lib\analytics\events.ts",
    
    # Unused Hooks
    "hooks\useAnonymousSession.ts",  # If not used
    "hooks\usePrivacyProtection.ts",  # If not used
    "hooks\useSecurityEnhancement.ts",  # If not used
    
    # Empty/Template Files
    "types\unused.ts",
    
    # Test Files in Production
    "lib\__tests__",
    "components\__tests__",
    
    # Backup Files
    "next.config.js.backup"
)

$workspaceRoot = $PSScriptRoot | Split-Path -Parent
$deletedCount = 0
$skippedCount = 0

Write-Host "`n🗑️  BLOAT DELETION SCRIPT - PRODUCTION CLEANUP`n" -ForegroundColor Cyan

foreach ($file in $bloatFiles) {
    $fullPath = Join-Path $workspaceRoot $file
    
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Recurse -Force -ErrorAction Stop
            Write-Host "✅ Deleted: $file" -ForegroundColor Green
            $deletedCount++
        } catch {
            Write-Host "❌ Failed to delete: $file - $($_.Exception.Message)" -ForegroundColor Red
            $skippedCount++
        }
    } else {
        Write-Host "⏭️  Skipped (not found): $file" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host "`n📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "   Deleted: $deletedCount files" -ForegroundColor Green
Write-Host "   Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "`n✨ Bloat cleanup complete!`n" -ForegroundColor Green
