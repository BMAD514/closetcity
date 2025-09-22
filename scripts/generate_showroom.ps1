param(
    [Parameter(Mandatory = $true)][string]$Source,
    [string]$ApiBase = "http://127.0.0.1:8788",
    [string]$UploadsPrefix = "inventory/uploads",
    [string]$OutputDir = "inventory/showroom",
    [switch]$SkipDownload,
    [switch]$Local
)

if (!(Test-Path -LiteralPath $Source)) {
    throw "Source file not found: $Source"
}

$root = Get-Location
$resolvedOutputDir = Join-Path $root $OutputDir
if (!(Test-Path -LiteralPath $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null
}

$ext = [IO.Path]::GetExtension($Source)
if (-not $ext) { $ext = '.jpg' }
$timestamp = Get-Date -Format 'yyyyMMddHHmmssfff'
$remoteName = "$timestamp$ext"
$remoteKey = "$UploadsPrefix/$remoteName"

Write-Host "Uploading source image to R2 as $remoteKey" -ForegroundColor Cyan
$uploadArgs = @('r2', 'object', 'put', "closetcity-storage/$remoteKey", '--file', $Source)
if ($Local) {
    $uploadArgs += '--local'
}
npx wrangler @uploadArgs

$sourceUrl = "$ApiBase/api/r2/$remoteKey"

Write-Host "Requesting showroom render from $($ApiBase)/api/model" -ForegroundColor Cyan
$payload = @{ userImageUrl = $sourceUrl } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$ApiBase/api/model" -Method Post -Body $payload -ContentType 'application/json'

$finalUrl = $null
if ($response.url) {
    $finalUrl = $response.url
} elseif ($response.jobId) {
    $jobId = $response.jobId
    Write-Host "Job queued ($jobId). Polling status..." -ForegroundColor Yellow
    do {
        Start-Sleep -Seconds 3
        $job = Invoke-RestMethod -Uri "$ApiBase/api/jobs/$jobId" -Method Get
        Write-Host "Status: $($job.status)" -ForegroundColor DarkGray
    } while ($job.status -eq 'queued' -or $job.status -eq 'processing')

    if ($job.status -ne 'succeeded') {
        $errorMsg = $job.error
        if (-not $errorMsg) { $errorMsg = 'Unknown error' }
        throw "Generation failed: $errorMsg"
    }
    $finalUrl = $job.output.url
} else {
    throw "Unexpected response from generator: $($response | ConvertTo-Json -Depth 4)"
}

if ($finalUrl.StartsWith('/')) {
    $finalUrl = "$ApiBase$finalUrl"
}

Write-Host "Showroom image available at $finalUrl" -ForegroundColor Green

if (-not $SkipDownload) {
    $outputPath = Join-Path $resolvedOutputDir "$timestamp-showroom.webp"
    Write-Host "Downloading to $outputPath" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $finalUrl -OutFile $outputPath | Out-Null
    Write-Host "Saved $outputPath" -ForegroundColor Green
}

Write-Host "Done." -ForegroundColor Green
