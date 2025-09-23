# Update listing_media try-on URLs once renders are generated
# Usage: .\apply_tryon_results.ps1 -ResultsFile inventory\tryon_results.json
param(
    [Parameter(Mandatory=$true)]
    [string]$ResultsFile,
    [switch]$Local
)

if (!(Test-Path $ResultsFile)) {
    throw "Results file not found: $ResultsFile"
}

$entries = Get-Content $ResultsFile | ConvertFrom-Json
$dataset = 'closetcity-db'
$target = if ($Local) { '--local' } else { '--remote' }

foreach ($entry in $entries) {
    $id = $entry.id
    $url = $entry.url
    if (-not $id -or -not $url) {
        Write-Warning "Skipping entry with missing id/url: $entry"
        continue
    }
    $sql = "UPDATE listing_media SET url='${url}' WHERE id='${id}';"
    Write-Host "Updating $id"
    wrangler d1 execute $dataset $target --command $sql
}
