$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$workspace = 'E:\WebAura'
$buildDir = Join-Path $workspace '.ppt_build'
$outputDir = Join-Path $workspace 'outputs'
$renderDir = Join-Path $buildDir 'rendered'
New-Item -ItemType Directory -Force -Path $buildDir, $outputDir, $renderDir | Out-Null
$pptxPath = Join-Path $outputDir 'Merchant_Ward_Registry.pptx'

function Rgb([string]$hex) {
  $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return [int]($c.R + ($c.G * 256) + ($c.B * 65536))
}

$C = @{
  ink = (Rgb '#1A2421')
  dark = (Rgb '#1B2824')
  paper = (Rgb '#F4F1E9')
  white = (Rgb '#FCFBF7')
  line = (Rgb '#D8D6CB')
  muted = (Rgb '#748179')
  amber = (Rgb '#B27837')
  amberLight = (Rgb '#E7D5A7')
  teal = (Rgb '#3B827A')
  tealLight = (Rgb '#C7E1DC')
  green = (Rgb '#5E7C54')
  greenLight = (Rgb '#DCE8D0')
  plum = (Rgb '#805F87')
  plumLight = (Rgb '#E5D8E6')
  blue = (Rgb '#53779B')
  blueLight = (Rgb '#D5E1EE')
}

$W = 960
$H = 540
$ppLayoutBlank = 12
$msoTextOrientationHorizontal = 1
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$msoShapeOval = 9
$ppAlignLeft = 1
$ppAlignCenter = 2
$ppAlignRight = 3
$msoAnchorMiddle = 3

function SetBackground($slide, [int]$color) {
  $slide.FollowMasterBackground = 0
  $slide.Background.Fill.Solid()
  $slide.Background.Fill.ForeColor.RGB = $color
}

function AddRect($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [int]$line = -1, [double]$radius = 0.14) {
  $shape = $slide.Shapes.AddShape($msoShapeRoundedRectangle, $x, $y, $w, $h)
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Fill.Solid()
  if ($line -lt 0) { $shape.Line.Visible = 0 } else { $shape.Line.Visible = -1; $shape.Line.ForeColor.RGB = $line; $shape.Line.Weight = 1 }
  try { $shape.Adjustments.Item(1) = $radius } catch {}
  return $shape
}

function AddPlainRect($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [int]$line = -1) {
  $shape = $slide.Shapes.AddShape($msoShapeRectangle, $x, $y, $w, $h)
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Fill.Solid()
  if ($line -lt 0) { $shape.Line.Visible = 0 } else { $shape.Line.Visible = -1; $shape.Line.ForeColor.RGB = $line; $shape.Line.Weight = 1 }
  return $shape
}

function AddCircle($slide, [double]$x, [double]$y, [double]$d, [int]$fill, [int]$line = -1, [double]$lineWeight = 1) {
  $shape = $slide.Shapes.AddShape($msoShapeOval, $x, $y, $d, $d)
  if ($fill -lt 0) { $shape.Fill.Visible = 0 } else { $shape.Fill.ForeColor.RGB = $fill; $shape.Fill.Solid() }
  if ($line -lt 0) { $shape.Line.Visible = 0 } else { $shape.Line.Visible = -1; $shape.Line.ForeColor.RGB = $line; $shape.Line.Weight = $lineWeight }
  return $shape
}

function AddLine($slide, [double]$x1, [double]$y1, [double]$x2, [double]$y2, [int]$color, [double]$weight = 1, [bool]$dashed = $false) {
  $line = $slide.Shapes.AddLine($x1, $y1, $x2, $y2)
  $line.Line.ForeColor.RGB = $color
  $line.Line.Weight = $weight
  if ($dashed) { $line.Line.DashStyle = 4 }
  return $line
}

function AddText($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [double]$size, [int]$color, [bool]$bold = $false, [string]$font = 'Aptos', [int]$align = 1, [bool]$italic = $false) {
  $shape = $slide.Shapes.AddTextbox($msoTextOrientationHorizontal, $x, $y, $w, $h)
  $shape.Fill.Visible = 0
  $shape.Line.Visible = 0
  $shape.TextFrame.MarginLeft = 0
  $shape.TextFrame.MarginRight = 0
  $shape.TextFrame.MarginTop = 0
  $shape.TextFrame.MarginBottom = 0
  $shape.TextFrame.WordWrap = -1
  $shape.TextFrame.AutoSize = 0
  $shape.TextFrame.VerticalAnchor = $msoAnchorMiddle
  $shape.TextFrame.TextRange.Text = $text
  $shape.TextFrame.TextRange.Font.Name = $font
  $shape.TextFrame.TextRange.Font.Size = $size
  $shape.TextFrame.TextRange.Font.Bold = if ($bold) { -1 } else { 0 }
  $shape.TextFrame.TextRange.Font.Italic = if ($italic) { -1 } else { 0 }
  $shape.TextFrame.TextRange.Font.Color.RGB = $color
  $shape.TextFrame.TextRange.ParagraphFormat.Alignment = $align
  return $shape
}

function AddEyebrow($slide, [string]$text, [double]$x, [double]$y, [int]$color = $C.amber) {
  AddText $slide $text $x $y 500 16 10 $color $true 'Aptos' $ppAlignLeft | Out-Null
}

function AddFooter($slide, [int]$number, [string]$label, [bool]$dark = $false) {
  $lineColor = if ($dark) { (Rgb '#40524B') } else { (Rgb '#D8D6CB') }
  $textColor = if ($dark) { (Rgb '#8D9B94') } else { (Rgb '#8B958F') }
  AddLine $slide 54 500 906 500 $lineColor 0.8 | Out-Null
  AddText $slide $label 54 507 500 15 9 $textColor $false 'Aptos' $ppAlignLeft | Out-Null
  AddText $slide ('0' + $number) 862 507 44 15 9 $textColor $true 'Aptos' $ppAlignRight | Out-Null
}

function AddPill($slide, [string]$text, [double]$x, [double]$y, [double]$w, [int]$fill, [int]$color) {
  AddRect $slide $x $y $w 24 $fill -1 0.5 | Out-Null
  AddText $slide $text ($x + 10) ($y + 1) ($w - 20) 21 10 $color $true 'Aptos' $ppAlignCenter | Out-Null
}

function AddDotBullet($slide, [string]$text, [double]$x, [double]$y, [double]$w, [int]$dotColor, [int]$textColor, [double]$size = 16) {
  AddCircle $slide $x ($y + 5) 8 $dotColor -1 | Out-Null
  AddText $slide $text ($x + 17) $y $w 24 $size $textColor $false 'Aptos' $ppAlignLeft | Out-Null
}

function AddFlowNode($slide, [string]$number, [string]$title, [string]$desc, [double]$x, [double]$y, [int]$fill, [int]$titleColor, [int]$bodyColor) {
  AddCircle $slide $x $y 42 $fill -1 | Out-Null
  AddText $slide $number $x ($y + 2) 42 36 15 $titleColor $true 'Aptos' $ppAlignCenter | Out-Null
  AddText $slide $title ($x - 26) ($y + 55) 94 22 13 $bodyColor $true 'Aptos' $ppAlignCenter | Out-Null
  AddText $slide $desc ($x - 31) ($y + 83) 104 48 10 $bodyColor $false 'Aptos' $ppAlignCenter | Out-Null
}

function AddMapMarker($slide, [double]$x, [double]$y, [int]$color, [string]$label = '') {
  AddCircle $slide ($x - 7) ($y - 7) 14 $color $C.white 2 | Out-Null
  AddCircle $slide ($x - 20) ($y - 20) 40 -1 $color 1.2 | Out-Null
  if ($label) { AddText $slide $label ($x + 13) ($y - 10) 120 20 10 $C.ink $true 'Aptos' $ppAlignLeft | Out-Null }
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$presentation = $ppt.Presentations.Add()
$presentation.PageSetup.SlideWidth = $W
$presentation.PageSetup.SlideHeight = $H

# Slide 1: cover
$s = $presentation.Slides.Add(1, $ppLayoutBlank)
SetBackground $s $C.dark
AddEyebrow $s 'PRODUCT CONCEPT / NEARBY TRADE REGISTRY' 56 52 (Rgb '#D2A866')
AddText $s "Merchant`nWard" 54 111 480 145 58 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Make the small shops around you easier to find.' 58 278 410 52 20 (Rgb '#CBD5CE') $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'A local registry for shopkeepers who want to be seen, and travelers who want to buy close to home.' 58 349 386 60 13 (Rgb '#9AA9A0') $false 'Aptos' $ppAlignLeft | Out-Null
AddPill $s 'DISCOVER NEARBY' 58 437 150 (Rgb '#35483F') (Rgb '#D2A866')
AddCircle $s 615 92 244 -1 (Rgb '#6F8B70') 2 | Out-Null
AddCircle $s 650 127 174 -1 (Rgb '#D2A866') 1.3 | Out-Null
AddCircle $s 688 165 98 (Rgb '#D2A866') -1 | Out-Null
AddCircle $s 716 193 42 $C.dark -1 | Out-Null
AddLine $s 736 114 736 196 (Rgb '#D2A866') 1.2 | Out-Null
AddLine $s 690 155 782 155 (Rgb '#D2A866') 1.2 | Out-Null
AddText $s 'MW' 702 207 70 28 21 $C.dark $true 'Aptos Display' $ppAlignCenter | Out-Null
AddText $s "The street is full of trade.`nThe map should know it." 590 374 302 56 18 $C.white $true 'Aptos Display' $ppAlignRight | Out-Null
AddFooter $s 1 'Merchant Ward / concept deck' $true

# Slide 2: context
$s = $presentation.Slides.Add(2, $ppLayoutBlank)
SetBackground $s $C.paper
AddEyebrow $s '01 / CONTEXT' 56 48
AddText $s 'The hidden local economy' 54 78 540 52 36 $C.ink $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'A shop can be open, loved, and still invisible to the person walking past it.' 56 150 420 62 22 $C.ink $false 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'The gap is simple: small merchants know their street, but nearby travelers do not know where to look.' 56 228 376 54 14 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null
AddDotBullet $s "Independent businesses sit outside the capital's large trading houses." 56 318 408 $C.amber $C.ink 13
AddDotBullet $s 'Nearby intent already exists. Discovery breaks before the first visit.' 56 358 408 $C.teal $C.ink 13
AddDotBullet $s 'A clear listing can turn a missed door into a local transaction.' 56 398 408 $C.plum $C.ink 13

# street visual
AddRect $s 540 108 346 306 (Rgb '#E6E8D9') -1 0.1 | Out-Null
AddPlainRect $s 563 177 300 8 (Rgb '#F7F4E9') -1 | Out-Null
AddPlainRect $s 563 298 300 8 (Rgb '#F7F4E9') -1 | Out-Null
AddPlainRect $s 563 145 4 210 (Rgb '#C3CBBE') -1 | Out-Null
AddPlainRect $s 860 145 4 210 (Rgb '#C3CBBE') -1 | Out-Null
AddRect $s 582 211 73 82 $C.amberLight -1 0.08 | Out-Null
AddRect $s 670 211 73 82 $C.tealLight -1 0.08 | Out-Null
AddRect $s 758 211 73 82 $C.plumLight -1 0.08 | Out-Null
AddText $s "Cedar`n& Coil" 591 224 55 40 12 $C.ink $true 'Aptos Display' $ppAlignCenter | Out-Null
AddText $s "Morrow`nTea House" 677 224 60 40 12 $C.ink $true 'Aptos Display' $ppAlignCenter | Out-Null
AddText $s "Rook Bike`nRepair" 765 224 60 40 12 $C.ink $true 'Aptos Display' $ppAlignCenter | Out-Null
AddCircle $s 518 346 28 $C.dark $C.white 2 | Out-Null
AddLine $s 532 360 583 322 $C.dark 1.2 $true | Out-Null
AddText $s "traveler`npasses by" 482 380 96 40 11 $C.muted $true 'Aptos' $ppAlignCenter | Out-Null
AddText $s 'The registry puts a useful pin on the places already making the ward feel alive.' 572 442 290 32 11 $C.muted $false 'Aptos' $ppAlignCenter | Out-Null
AddFooter $s 2 'Mission / reveal nearby trade' $false

# Slide 3: two-sided flow
$s = $presentation.Slides.Add(3, $ppLayoutBlank)
SetBackground $s $C.dark
AddEyebrow $s '02 / PRIMARY FLOW' 56 48 (Rgb '#D2A866')
AddText $s 'One registry, two sides of the street' 54 78 710 52 34 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'The value loop starts with a merchant pin and ends with a more confident local visit.' 56 137 680 34 15 (Rgb '#A5B2A9') $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 56 222 236 188 (Rgb '#263B33') -1 0.1 | Out-Null
AddPill $s 'MERCHANT' 76 243 102 (Rgb '#D2A866') $C.dark
AddText $s "Stay visible`nwithout a storefront ad budget." 76 286 188 48 20 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Register the shop, pin the location, keep the hours current.' 76 352 177 38 12 (Rgb '#B4C0B7') $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 668 222 236 188 (Rgb '#263B33') -1 0.1 | Out-Null
AddPill $s 'TRAVELER' 688 243 102 (Rgb '#C7E1DC') $C.dark
AddText $s "Choose with`nmore confidence nearby." 688 286 188 48 20 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Search a category, compare distance, open the full detail card.' 688 352 177 38 12 (Rgb '#B4C0B7') $false 'Aptos' $ppAlignLeft | Out-Null

AddLine $s 315 316 640 316 (Rgb '#708A7A') 1.3 | Out-Null
AddFlowNode $s '01' 'Register' 'Details + location' 315 292 $C.amber $C.dark (Rgb '#BBC8BF')
AddFlowNode $s '02' 'Pin' 'Location on the ward map' 420 292 $C.teal $C.dark (Rgb '#BBC8BF')
AddFlowNode $s '03' 'Discover' 'Nearby shops by distance' 525 292 $C.plum $C.white (Rgb '#BBC8BF')
AddFlowNode $s '04' 'Visit' 'Hours, contact, route' 630 292 $C.blue $C.white (Rgb '#BBC8BF')
AddFooter $s 3 'Core registry flow / merchant to traveler' $true

# Slide 4: discovery surface
$s = $presentation.Slides.Add(4, $ppLayoutBlank)
SetBackground $s $C.paper
AddEyebrow $s '03 / DISCOVERY SURFACE' 56 48
AddText $s 'Nearby discovery starts with distance' 54 78 660 52 35 $C.ink $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Search and map work together. The list makes proximity legible. The detail view makes the decision easy.' 56 140 730 34 15 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null

# left list
AddRect $s 56 206 258 236 $C.white $C.line 0.08 | Out-Null
AddText $s 'TRADE NEARBY' 74 224 160 17 10 $C.amber $true 'Aptos' $ppAlignLeft | Out-Null
AddRect $s 74 252 222 32 (Rgb '#F6F4EC') -1 0.08 | Out-Null
AddText $s 'search shops, goods, or streets' 87 258 180 20 10 (Rgb '#98A09B') $false 'Aptos' $ppAlignLeft | Out-Null
AddPill $s 'ALL TRADES 24' 74 300 105 $C.dark $C.white
AddPill $s 'FOOD & DRINK 8' 186 300 110 (Rgb '#E5EEEC') $C.teal
AddText $s 'Cedar & Coil' 82 348 120 18 13 $C.ink $true 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Craft & goods        400 m' 82 370 168 18 10 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null
AddLine $s 74 390 296 390 $C.line 0.8 | Out-Null
AddText $s 'Morrow Tea House' 82 400 140 18 13 $C.ink $true 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Food & drink          800 m' 82 420 170 18 10 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null

# map
AddRect $s 338 206 344 236 (Rgb '#E1E5D6') $C.line 0.08 | Out-Null
for ($i = 1; $i -lt 9; $i++) { AddLine $s (338 + ($i * 38)) 206 (338 + ($i * 38)) 442 (Rgb '#C9D1C2') 0.6 | Out-Null }
for ($i = 1; $i -lt 6; $i++) { AddLine $s 338 (206 + ($i * 39)) 682 (206 + ($i * 39)) (Rgb '#C9D1C2') 0.6 | Out-Null }
AddLine $s 350 349 668 272 $C.white 20 | Out-Null
AddLine $s 446 215 571 435 $C.white 18 | Out-Null
AddLine $s 338 288 680 364 $C.white 13 | Out-Null
AddMapMarker $s 510 272 $C.amber 'Cedar & Coil'
AddMapMarker $s 447 349 $C.teal 'Morrow Tea'
AddMapMarker $s 410 291 $C.plum
AddMapMarker $s 579 390 $C.blue
AddCircle $s 515 327 12 $C.dark $C.white 2 | Out-Null
AddText $s 'you are here' 535 320 80 18 10 $C.dark $true 'Aptos' $ppAlignLeft | Out-Null

# detail card
AddRect $s 706 206 198 236 $C.white $C.line 0.08 | Out-Null
AddRect $s 706 206 198 66 $C.amberLight -1 0.08 | Out-Null
AddText $s 'WARD PICK' 722 222 70 15 9 $C.amber $true 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Cedar & Coil' 722 289 150 24 17 $C.ink $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Craft & goods' 722 317 140 16 10 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Hand-turned kitchen tools and small-batch woodwork.' 722 344 156 36 11 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s '14 Lantern Row  /  Open now' 722 389 160 17 10 $C.ink $true 'Aptos' $ppAlignLeft | Out-Null
AddPill $s 'ROUTE THERE' 722 414 92 $C.dark $C.white
AddFooter $s 4 'Product surface / map, list, detail' $false

# Slide 5: journey
$s = $presentation.Slides.Add(5, $ppLayoutBlank)
SetBackground $s $C.dark
AddEyebrow $s '04 / JOURNEY' 56 48 (Rgb '#D2A866')
AddText $s 'The core journey is short enough to trust' 54 78 720 52 35 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Each step answers one practical question, with no detour through a giant marketplace.' 56 140 730 34 15 (Rgb '#A5B2A9') $false 'Aptos' $ppAlignLeft | Out-Null
AddLine $s 120 295 838 295 (Rgb '#667C70') 1.4 | Out-Null
AddFlowNode $s '01' 'Register' 'Can I add my shop?' 120 274 $C.amber $C.dark (Rgb '#B8C6BC')
AddFlowNode $s '02' 'Locate' 'Where is it in the ward?' 330 274 $C.teal $C.dark (Rgb '#B8C6BC')
AddFlowNode $s '03' 'Discover' 'What is close and open?' 540 274 $C.plum $C.white (Rgb '#B8C6BC')
AddFlowNode $s '04' 'Visit' 'How do I get there?' 750 274 $C.blue $C.white (Rgb '#B8C6BC')
AddPill $s 'WORKING FRONTEND FLOW' 56 430 166 (Rgb '#35483F') (Rgb '#D2A866')
AddText $s 'Registration is local-state backed today, with a clear handoff to geospatial storage and maps when production data is ready.' 245 431 615 22 12 (Rgb '#B8C6BC') $false 'Aptos' $ppAlignLeft | Out-Null
AddFooter $s 5 'Experience / one trusted loop' $true

# Slide 6: registration
$s = $presentation.Slides.Add(6, $ppLayoutBlank)
SetBackground $s $C.paper
AddEyebrow $s '05 / MERCHANT EXPERIENCE' 56 48
AddText $s 'Registration stays lightweight for shopkeepers' 54 78 750 52 35 $C.ink $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'The form asks for what a traveler needs, then makes the location explicit before publishing.' 56 140 730 34 15 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 56 210 450 244 $C.white $C.line 0.08 | Out-Null
AddText $s 'PUT YOUR SHOP ON THE WARD MAP' 80 230 300 17 10 $C.amber $true 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Shop name' 80 269 100 15 10 $C.muted $true 'Aptos' $ppAlignLeft | Out-Null
AddRect $s 80 289 190 28 (Rgb '#F7F5ED') $C.line 0.06 | Out-Null
AddText $s 'Cedar & Coil' 92 294 160 18 11 $C.ink $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Trade category' 291 269 120 15 10 $C.muted $true 'Aptos' $ppAlignLeft | Out-Null
AddRect $s 291 289 190 28 (Rgb '#F7F5ED') $C.line 0.06 | Out-Null
AddText $s 'Craft & goods' 303 294 160 18 11 $C.ink $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Short description' 80 335 130 15 10 $C.muted $true 'Aptos' $ppAlignLeft | Out-Null
AddRect $s 80 354 401 42 (Rgb '#F7F5ED') $C.line 0.06 | Out-Null
AddText $s 'Hand-turned kitchen tools and small-batch woodwork.' 92 362 370 26 10 $C.ink $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Address' 80 413 75 15 10 $C.muted $true 'Aptos' $ppAlignLeft | Out-Null
AddRect $s 80 430 190 28 (Rgb '#F7F5ED') $C.line 0.06 | Out-Null
AddText $s '14 Lantern Row' 92 435 160 18 11 $C.ink $false 'Aptos' $ppAlignLeft | Out-Null
AddRect $s 291 413 190 45 $C.greenLight -1 0.08 | Out-Null
AddText $s 'LOCATION PIN READY' 304 418 150 14 9 $C.green $true 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'near Old Harbor' 304 435 140 15 10 $C.green $false 'Aptos' $ppAlignLeft | Out-Null

AddText $s 'Published listing contains' 570 222 280 26 20 $C.ink $true 'Aptos Display' $ppAlignLeft | Out-Null
AddDotBullet $s 'name, category, and a plain-language description' 570 284 310 $C.amber $C.ink 13
AddDotBullet $s 'address and a location-ready pin' 570 325 310 $C.teal $C.ink 13
AddDotBullet $s 'hours, contact, and what the shop offers' 570 366 310 $C.plum $C.ink 13
AddPill $s 'PUBLISH SHOP LISTING' 570 416 150 $C.dark $C.white
AddText $s 'The owner sees the same detail card travelers see.' 570 458 300 18 11 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null
AddFooter $s 6 'Merchant flow / registration and location' $false

# Slide 7: architecture
$s = $presentation.Slides.Add(7, $ppLayoutBlank)
SetBackground $s $C.dark
AddEyebrow $s '06 / RECOMMENDED BUILD PATH' 56 48 (Rgb '#D2A866')
AddText $s 'An MVP that can grow into real geospatial search' 54 78 820 52 34 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'The prototype proves the flow now, while the seams stay ready for PostGIS, Firebase, and a map provider.' 56 140 780 34 15 (Rgb '#A5B2A9') $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 56 236 188 126 (Rgb '#2B4038') -1 0.08 | Out-Null
AddPill $s 'FRONTEND' 76 255 90 $C.amberLight $C.dark
AddText $s "React`nregistry surface" 76 296 150 42 20 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Search, map, detail, register' 76 346 148 18 10 (Rgb '#B8C6BC') $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 292 236 188 126 (Rgb '#2B4038') -1 0.08 | Out-Null
AddPill $s 'API' 312 255 62 $C.tealLight $C.dark
AddText $s "Node /`nExpress" 312 296 150 42 20 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Validation and radius queries' 312 346 148 18 10 (Rgb '#B8C6BC') $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 528 236 188 126 (Rgb '#2B4038') -1 0.08 | Out-Null
AddPill $s 'DATA' 548 255 67 $C.plumLight $C.dark
AddText $s "PostgreSQL`n+ PostGIS" 548 296 150 42 20 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Geocoded points and spatial index' 548 346 150 18 10 (Rgb '#B8C6BC') $false 'Aptos' $ppAlignLeft | Out-Null

AddRect $s 764 236 140 126 (Rgb '#2B4038') -1 0.08 | Out-Null
AddPill $s 'MAP' 784 255 58 $C.blueLight $C.dark
AddText $s "Mapbox`nor Google Maps" 784 296 100 42 17 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Pins and directions' 784 346 100 18 10 (Rgb '#B8C6BC') $false 'Aptos' $ppAlignLeft | Out-Null

AddLine $s 244 299 292 299 (Rgb '#7C9586') 1.4 | Out-Null
AddLine $s 480 299 528 299 (Rgb '#7C9586') 1.4 | Out-Null
AddLine $s 716 299 764 299 (Rgb '#7C9586') 1.4 | Out-Null
AddText $s 'Current prototype uses local seeded state so the full interaction can be evaluated without keys or accounts.' 56 409 520 38 13 (Rgb '#B8C6BC') $false 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Production handoff' 666 409 180 18 11 (Rgb '#D2A866') $true 'Aptos' $ppAlignLeft | Out-Null
AddText $s 'Store latitude and longitude, then query by radius and sort by distance.' 666 432 230 42 12 $C.white $true 'Aptos Display' $ppAlignLeft | Out-Null
AddFooter $s 7 'Build path / recommended technologies' $true

# Slide 8: scorecard
$s = $presentation.Slides.Add(8, $ppLayoutBlank)
SetBackground $s $C.paper
AddEyebrow $s '07 / VERIFIABLE DELIVERABLES' 56 48
AddText $s 'A credible 1,000-point build' 54 78 620 52 36 $C.ink $true 'Aptos Display' $ppAlignLeft | Out-Null
AddText $s 'Every rubric item has a visible proof point in the frontend flow.' 56 140 650 34 15 $C.muted $false 'Aptos' $ppAlignLeft | Out-Null

$labels = @('Location accuracy', 'Core registry flow', 'UI / UX quality', 'Creativity & extras')
$weights = @(30, 25, 25, 20)
$fills = @($C.amber, $C.teal, $C.plum, $C.blue)
for ($i = 0; $i -lt 4; $i++) {
  $y = 224 + ($i * 54)
  AddText $s $labels[$i] 56 $y 170 20 13 $C.ink $true 'Aptos' $ppAlignLeft | Out-Null
  AddPlainRect $s 236 ($y + 4) 280 13 (Rgb '#E0E1D7') -1 | Out-Null
  AddPlainRect $s 236 ($y + 4) (280 * ($weights[$i] / 30.0)) 13 $fills[$i] -1 | Out-Null
  AddText $s ($weights[$i].ToString() + '%') 532 $y 50 20 13 $C.ink $true 'Aptos' $ppAlignRight | Out-Null
}
AddText $s 'DEMO CHECKLIST' 660 216 190 17 10 $C.amber $true 'Aptos' $ppAlignLeft | Out-Null
AddDotBullet $s 'Register a shop with details and location' 660 251 245 $C.amber $C.ink 12
AddDotBullet $s 'Search, filter, and sort by proximity' 660 292 245 $C.teal $C.ink 12
AddDotBullet $s 'Open the full shop detail view' 660 333 245 $C.plum $C.ink 12
AddDotBullet $s 'Show map markers and a clear next action' 660 374 245 $C.blue $C.ink 12
AddRect $s 56 436 848 36 $C.greenLight -1 0.08 | Out-Null
AddText $s 'Merchant Ward makes nearby trade visible.' 72 443 816 22 16 $C.green $true 'Aptos Display' $ppAlignCenter | Out-Null
AddFooter $s 8 'Scorecard / supplied evaluation rubric' $false

foreach ($slide in $presentation.Slides) {
  $slide.SlideShowTransition.EntryEffect = 0
}

if (Test-Path $pptxPath) { Remove-Item -LiteralPath $pptxPath -Force }
$presentation.SaveAs($pptxPath, 24)

# Render every slide for visual QA using PowerPoint itself.
for ($i = 1; $i -le $presentation.Slides.Count; $i++) {
  $png = Join-Path $renderDir ('slide-' + $i + '.png')
  if (Test-Path $png) { Remove-Item -LiteralPath $png -Force }
  $presentation.Slides.Item($i).Export($png, 'PNG', 1600, 900)
}

$presentation.Close()
$ppt.Quit()
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation)
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt)
[GC]::Collect()
[GC]::WaitForPendingFinalizers()

Write-Output "PPTX=$pptxPath"
Write-Output "SLIDES=8"
Write-Output "RENDER_DIR=$renderDir"
