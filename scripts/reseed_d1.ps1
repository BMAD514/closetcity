# Reseed closet.city D1 database with refreshed inventory
# Usage: .\reseed_d1.ps1 [--local]
param(
    [switch]$Local
)

$dataset = 'closetcity-db'
$command = "npx wrangler d1 execute $dataset --file=seeds/garments.sql"
if ($Local) {
    $command += ' --local'
} else {
    $command += ' --remote'
}

Write-Host "Running: $command"
Invoke-Expression $command
