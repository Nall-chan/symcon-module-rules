param([string]$Src, [string]$Dst)
# Schneidet einen maximierten Kachel-Dialog auf den Inhalt zu:
# oberer Teil bis zur letzten Inhaltszeile + unterer Dialogrand aus dem Original.
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile($Src)
$w = $img.Width; $h = $img.Height
$last = 60
for ($y = $h - 30; $y -gt 60; $y--) {
    $found = $false
    for ($x = 30; $x -lt ($w - 30); $x += 2) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -lt 200 -or $p.G -lt 200 -or $p.B -lt 200) { $found = $true; break }
    }
    if ($found) { $last = $y; break }
}
$top = [Math]::Min($last + 24, $h - 24)
$bottom = 24
$out = New-Object System.Drawing.Bitmap($w, ($top + $bottom))
$g = [System.Drawing.Graphics]::FromImage($out)
$g.DrawImage($img, [System.Drawing.Rectangle]::new(0, 0, $w, $top), [System.Drawing.Rectangle]::new(0, 0, $w, $top), [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($img, [System.Drawing.Rectangle]::new(0, $top, $w, $bottom), [System.Drawing.Rectangle]::new(0, $h - $bottom, $w, $bottom), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose(); $img.Dispose()
$out.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
"$w x $($top + $bottom)"
