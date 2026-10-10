param([string]$Src, [string]$Dst)
# Schneidet die Instanzkonfiguration der Konsole zu: von der Statuszeile bis zum Trennbalken vor den Aktionen.
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile($Src)
$top = 180
$bottom = $img.Height - 1
for ($y = 240; $y -lt $img.Height; $y++) {
    $a = $img.GetPixel(300, $y); $b = $img.GetPixel(1000, $y)
    # Trennbalken: gleiche dunkle Farbe über die ganze Breite
    if ($a.R -lt 140 -and $a.ToArgb() -eq $b.ToArgb() -and $a.B -gt $a.R) { $bottom = $y - 4; break }
}
$c = $img.Clone([System.Drawing.Rectangle]::new(35, $top, 1104, $bottom - $top), $img.PixelFormat)
$c.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png)
"$($c.Width) x $($c.Height)"
$c.Dispose(); $img.Dispose()
