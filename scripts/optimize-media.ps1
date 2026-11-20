<#
.SYNOPSIS
  ابزار استاندارد بهینه‌سازی صوت و والپیپر برای آپلود در Supabase Storage (باکت noor-media)
.EXAMPLE
  .scriptsoptimize-media.ps1 -InputFile "C:pathazan.mp3" -Mode speech
  .scriptsoptimize-media.ps1 -InputFile "C:path	awashih.mp3" -Mode music
  .scriptsoptimize-media.ps1 -InputFile "C:pathharam.jpg" -Mode wallpaper
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,

  [ValidateSet("speech", "music", "wallpaper")]
  [string]$Mode = "speech"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputFile)) {
  throw "فایل پیدا نشد: $InputFile"
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "⚠️ ffmpeg روی سیستم نصب نیست. برای نصب سریع با winget این دستور را بزن:" -ForegroundColor Yellow
  Write-Host "winget install Gyan.FFmpeg" -ForegroundColor Cyan
  exit 1
}

$item = Get-Item $InputFile
$outDir = Join-Path $item.DirectoryName "noor-optimized"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$baseName = [System.IO.Path]::GetFileNameWithoutExtension($item.Name)

if ($Mode -eq "speech") {
  $outFile = Join-Path $outDir "$baseName-48k-mono.mp3"
  ffmpeg -y -i $item.FullName -ac 1 -ar 24000 -b:a 48k -af "loudnorm=I=-16:TP=-1.5:LRA=11" $outFile
} elseif ($Mode -eq "music") {
  $outFile = Join-Path $outDir "$baseName-64k-stereo.mp3"
  ffmpeg -y -i $item.FullName -ac 2 -ar 44100 -b:a 64k -af "loudnorm=I=-16:TP=-1.5:LRA=11" $outFile
} else {
  $outFile = Join-Path $outDir "$baseName-960x540.jpg"
  ffmpeg -y -i $item.FullName -vf "scale=960:540:force_original_aspect_ratio=increase,crop=960:540" -q:v 4 $outFile
}

$beforeKB = [math]::Round($item.Length / 1KB, 1)
$afterKB = [math]::Round((Get-Item $outFile).Length / 1KB, 1)
Write-Host "✅ آماده آپلود در Supabase Storage (باکت noor-media):" -ForegroundColor Green
Write-Host "   مسیر: $outFile" -ForegroundColor White
Write-Host "   حجم: $beforeKB KB  --->  $afterKB KB" -ForegroundColor Cyan
