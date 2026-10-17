param([string]$Src, [string]$Dst, [int]$Bottom = 0, [int]$Width = 1104)
# Schneidet die Instanzkonfiguration der Konsole zu: von der Statuszeile bis zum Trennbalken vor den Aktionen.
# Mit -Bottom <y> wird stattdessen bis zu dieser Zeile des Originals geschnitten, z. B. um den Aktionsbereich
# ohne Spendenbereich aufzunehmen (y vorher mit einem shot ermitteln: Zeile oberhalb des Spendentextes).
# -Width ändert die Breite ab x = 35 (Standard 1104), z. B. wenn lange Texte im Aktionsbereich sonst abgeschnitten werden.
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile($Src)
$top = 180
$end = $img.Height - 1
if ($Bottom -gt $top) {
    $end = [Math]::Min($Bottom, $img.Height - 1)
} else {
    for ($y = 240; $y -lt $img.Height; $y++) {
        $a = $img.GetPixel(300, $y); $b = $img.GetPixel(1000, $y)
        # Trennbalken: gleiche dunkle Farbe über die ganze Breite
        if ($a.R -lt 140 -and $a.ToArgb() -eq $b.ToArgb() -and $a.B -gt $a.R) { $end = $y - 4; break }
    }
}
$c = $img.Clone([System.Drawing.Rectangle]::new(35, $top, [Math]::Min($Width, $img.Width - 35), $end - $top), $img.PixelFormat)
$c.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png)
"$($c.Width) x $($c.Height)"
$c.Dispose(); $img.Dispose()
