Add-Type -AssemblyName System.Drawing

$logoFile = Join-Path $PSScriptRoot "..\apps\web\public\logo.png"
$fullPath = [System.IO.Path]::GetFullPath($logoFile)
Write-Host "Loading logo from: $fullPath"

$srcImage = [System.Drawing.Image]::FromFile($fullPath)

function Resize-To-PngBytes([System.Drawing.Image]$img, [int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $bytes = $ms.ToArray()
    $ms.Dispose()
    return ,$bytes
}

# Generate PNG byte arrays
$png16  = Resize-To-PngBytes $srcImage 16
$png32  = Resize-To-PngBytes $srcImage 32
$png48  = Resize-To-PngBytes $srcImage 48
$png180 = Resize-To-PngBytes $srcImage 180
$png192 = Resize-To-PngBytes $srcImage 192
$png512 = Resize-To-PngBytes $srcImage 512

$srcImage.Dispose()

Write-Host "16x16 size:  $($png16.Length) bytes"
Write-Host "32x32 size:  $($png32.Length) bytes"
Write-Host "48x48 size:  $($png48.Length) bytes"
Write-Host "180x180 size:$($png180.Length) bytes"
Write-Host "192x192 size:$($png192.Length) bytes"

$publicDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\apps\web\public"))
$appDir    = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\apps\web\src\app"))

# Save PNGs to public
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "icon-32x32.png"), $png32)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "favicon-32x32.png"), $png32)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "favicon-16x16.png"), $png16)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "icon.png"), $png192)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "icon-192.png"), $png192)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "icon-512.png"), $png512)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "apple-icon.png"), $png180)
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "apple-touch-icon.png"), $png180)

# Save App Router icon assets to src/app
[System.IO.File]::WriteAllBytes((Join-Path $appDir "icon.png"), $png192)
[System.IO.File]::WriteAllBytes((Join-Path $appDir "apple-icon.png"), $png180)

# Build standard multi-resolution ICO file with 16x16, 32x32, 48x48
$frames = @($png16, $png32, $png48)
$frameSizes = @(16, 32, 48)

$icoStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($icoStream)

# ICO Header: Reserved=0 (2 bytes), Type=1 (2 bytes), Count=3 (2 bytes)
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]$frames.Count)

# Directory entries: 16 bytes each
$offset = 6 + (16 * $frames.Count)
for ($i = 0; $i -lt $frames.Count; $i++) {
    $size = $frameSizes[$i]
    $data = $frames[$i]
    $writer.Write([byte]$size)              # Width
    $writer.Write([byte]$size)              # Height
    $writer.Write([byte]0)                  # Color count
    $writer.Write([byte]0)                  # Reserved
    $writer.Write([uint16]1)                # Color planes
    $writer.Write([uint16]32)               # Bits per pixel
    $writer.Write([uint32]$data.Length)     # Image size
    $writer.Write([uint32]$offset)          # Image offset
    $offset += $data.Length
}

# Image frame payload
for ($i = 0; $i -lt $frames.Count; $i++) {
    $data = $frames[$i]
    $writer.Write($data, 0, $data.Length)
}

$writer.Flush()
$icoBytes = $icoStream.ToArray()
$writer.Dispose()
$icoStream.Dispose()

[System.IO.File]::WriteAllBytes((Join-Path $publicDir "favicon.ico"), $icoBytes)
[System.IO.File]::WriteAllBytes((Join-Path $appDir "favicon.ico"), $icoBytes)

Write-Host "Generated favicon.ico: $($icoBytes.Length) bytes (includes 16x16, 32x32, 48x48 frames)"
Write-Host "All favicon and icon assets successfully generated from existing Mani-Annan logo!"
