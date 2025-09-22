param(
    [string]$Folder = "inventory",
    [string]$ApiBase = "http://127.0.0.1:8788",
    [string]$UploadsPrefix = "inventory/uploads",
    [string]$OutputDir = "inventory/showroom",
    [switch]$SkipDownload,
    [switch]$Local,
    [switch]$SkipExisting
)

$extensions = @('*.jpg','*.jpeg','*.png','*.webp')
$root = Get-Location
$fullFolder = Resolve-Path -LiteralPath $Folder -ErrorAction SilentlyContinue
if (-not $fullFolder) {
    throw "Folder not found: $Folder"
}

$files = Get-ChildItem -Path $fullFolder.Path -Include $extensions -File -Recurse | Sort-Object FullName
if (-not $files) {
    Write-Host "No images found in $($fullFolder.Path)" -ForegroundColor Yellow
    exit 0
}

Write-Host "Processing $($files.Count) files from $($fullFolder.Path)" -ForegroundColor Cyan

foreach ($file in $files) {
    $args = @('-File', 'scripts/generate_showroom.ps1', '-Source', $file.FullName,
        '-ApiBase', $ApiBase,
        '-UploadsPrefix', $UploadsPrefix,
        '-OutputDir', $OutputDir)
    if ($SkipDownload) { $args += '-SkipDownload' }
    if ($Local) { $args += '-Local' }

    if ($SkipExisting) {
        $targetDir = Join-Path $root $OutputDir
        $pattern = "$($file.BaseName)*.webp"
        if (Test-Path $targetDir) {
            $existing = Get-ChildItem -Path $targetDir -Filter $pattern -File -ErrorAction SilentlyContinue
            if ($existing) {
                Write-Host "Skipping $($file.Name) (already has output)" -ForegroundColor DarkGray
                continue
            }
        }
    }

    Write-Host "Processing $($file.Name)" -ForegroundColor Green
    pwsh @args
}

Write-Host "Done." -ForegroundColor Green
