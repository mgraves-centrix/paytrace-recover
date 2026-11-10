param(
  [string]$Source = "$env:USERPROFILE\Downloads\PayTrace-Cole-Demo.mp4",
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\..\paytrace-video-submission')
)
$ErrorActionPreference='Stop'
if (-not (Test-Path -LiteralPath $Source)) { throw "Source video not found: $Source" }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$out=(Resolve-Path -LiteralPath $OutputDirectory).Path
$work=Join-Path $out 'work'
New-Item -ItemType Directory -Force -Path $work | Out-Null
Add-Type -AssemblyName System.Drawing

function New-Card([string]$Path,[string]$Label,[string]$Headline,[string]$Subline,[string]$Accent) {
  $bmp=New-Object System.Drawing.Bitmap 1920,1080
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode='AntiAlias'; $g.TextRenderingHint='AntiAliasGridFit'
  $bg=[System.Drawing.ColorTranslator]::FromHtml('#092f43')
  $a=[System.Drawing.ColorTranslator]::FromHtml($Accent)
  $white=[System.Drawing.ColorTranslator]::FromHtml('#f8fbf6')
  $muted=[System.Drawing.ColorTranslator]::FromHtml('#c2d9d7')
  $g.Clear($bg)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(24,$a))),1200,-320,850,850)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,$a))),1350,480,520,520)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $a),110,150,120,9)
  $labelFont=New-Object System.Drawing.Font('Segoe UI',28,[System.Drawing.FontStyle]::Bold)
  $headFont=New-Object System.Drawing.Font('Georgia',92,[System.Drawing.FontStyle]::Regular)
  $subFont=New-Object System.Drawing.Font('Segoe UI',32,[System.Drawing.FontStyle]::Regular)
  $smallFont=New-Object System.Drawing.Font('Segoe UI',22,[System.Drawing.FontStyle]::Bold)
  $g.DrawString($Label,$labelFont,(New-Object System.Drawing.SolidBrush $a),110,185)
  $isCourse=$Label -eq 'THE PROBLEM' -or $Label -eq 'THE LEARNER OUTCOME'
  $headRect=New-Object System.Drawing.RectangleF(100,270,$(if($isCourse){900}else{1500}),480)
  $g.DrawString($Headline,$headFont,(New-Object System.Drawing.SolidBrush $white),$headRect)
  if($isCourse){
    $paper=[System.Drawing.ColorTranslator]::FromHtml('#fffdf8')
    $deep=[System.Drawing.ColorTranslator]::FromHtml('#123f49')
    $soft=[System.Drawing.ColorTranslator]::FromHtml('#e3f1e9')
    $g.FillRectangle((New-Object System.Drawing.SolidBrush $paper),1090,275,700,440)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush $deep),1090,275,700,86)
    $uiHead=New-Object System.Drawing.Font('Georgia',27)
    $uiBody=New-Object System.Drawing.Font('Segoe UI',18)
    $uiStatus=New-Object System.Drawing.Font('Segoe UI',20,[System.Drawing.FontStyle]::Bold)
    $g.DrawString('Light & Story  /  Your first lesson',$uiHead,(New-Object System.Drawing.SolidBrush $white),1120,296)
    $g.DrawString('01  /  Find your light',$uiHead,(New-Object System.Drawing.SolidBrush $deep),1120,394)
    $g.DrawString('One simple scene. A new way of seeing it.',$uiBody,(New-Object System.Drawing.SolidBrush $deep),1120,445)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush $soft),1120,510,640,106)
    $status=$(if($Label -eq 'THE PROBLEM'){'ACCESS LOCKED'}else{'LESSON OPEN'})
    $detail=$(if($Label -eq 'THE PROBLEM'){'Payment recorded. Entitlement missing.'}else{'Protected lesson content reached the learner.'})
    $g.DrawString($status,$uiStatus,(New-Object System.Drawing.SolidBrush $deep),1140,526)
    $g.DrawString($detail,$uiBody,(New-Object System.Drawing.SolidBrush $deep),1140,565)
    $g.DrawString('COURSE VIEW  /  VISUAL PREVIEW',$smallFont,(New-Object System.Drawing.SolidBrush $muted),1090,731)
  }
  $subRect=New-Object System.Drawing.RectangleF(110,785,1600,140)
  $g.DrawString($Subline,$subFont,(New-Object System.Drawing.SolidBrush $muted),$subRect)
  $footer=if($Label -eq 'THE PROBLEM'){'PAYTRACE RECOVER  /  FICTIONAL WALKTHROUGH'}elseif($Label -eq 'THE LEARNER OUTCOME'){'COURSE VIEW PREVIEW  /  PROTECTED ACCESS'}else{'PAYTRACE RECOVER  /  CONNECTED SANDBOX RECORDING'}
  $g.DrawString($footer,$smallFont,(New-Object System.Drawing.SolidBrush $muted),110,1005)
  $bmp.Save($Path,[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose();$bmp.Dispose()
}
New-Card (Join-Path $work '01-lock.png') 'THE PROBLEM' "Payment complete.`nLesson locked." 'One purchase. One missing entitlement. A learner waiting.' '#f4c47a'
New-Card (Join-Path $work '02-proof.png') 'CONNECTED SANDBOX' "Evidence before`naction." 'PayPal capture, AI review, merchant decision, course service, and lesson proof.' '#83e4da'
New-Card (Join-Path $work '03-course.png') 'THE LEARNER OUTCOME' "The same lesson.`nNow open." 'The protected course lesson opens only when current access is verified.' '#f4c47a'
New-Card (Join-Path $work '04-end.png') 'PAYTRACE RECOVER' "Paid is the start.`nProof is the finish." 'See the sandbox checkout and follow a case through to the learner.' '#83e4da'

$clips=@(
  @{kind='card';file='01-lock.png';duration=4},
  @{kind='source';start=21;duration=9},
  @{kind='source';start=31;duration=9},
  @{kind='source';start=41;duration=9},
  @{kind='source';start=51;duration=8},
  @{kind='source';start=68;duration=6},
  @{kind='card';file='02-proof.png';duration=4},
  @{kind='source';start=130;duration=9},
  @{kind='card';file='03-course.png';duration=5},
  @{kind='source';start=151;duration=10},
  @{kind='card';file='04-end.png';duration=4}
)
$list=Join-Path $work 'concat.txt';$lines=@();$i=0
foreach($clip in $clips){
  $segment=Join-Path $work ('segment-{0:D2}.mp4' -f $i)
  if($clip.kind -eq 'card'){
    & ffmpeg -hide_banner -loglevel error -y -loop 1 -framerate 30 -t $clip.duration -i (Join-Path $work $clip.file) -f lavfi -t $clip.duration -i 'anullsrc=channel_layout=stereo:sample_rate=48000' -map 0:v:0 -map 1:a:0 -vf 'scale=1920:1080,format=yuv420p' -c:v libx264 -preset veryfast -crf 20 -c:a aac -ar 48000 -ac 2 -b:a 160k -shortest $segment
  }else{
    $visual=if($clip.start -lt 100){'fps=30,crop=1600:900:260:0,scale=1920:1080:flags=lanczos,format=yuv420p'}elseif($clip.start -eq 130){'fps=30,crop=1280:720:400:0,scale=1920:1080:flags=lanczos,format=yuv420p'}else{'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p'}
    $fadeStart=$clip.duration-0.3
    $audioFilter="afade=t=in:st=0:d=0.25,afade=t=out:st=${fadeStart}:d=0.3"
    & ffmpeg -hide_banner -loglevel error -y -ss $clip.start -t $clip.duration -i $Source -map 0:v:0 -map 0:a:0 -vf $visual -af $audioFilter -c:v libx264 -preset veryfast -crf 20 -c:a aac -ar 48000 -ac 2 -b:a 160k $segment
  }
  if($LASTEXITCODE -ne 0){throw "Video segment $i failed"}
  $lines += "file '$($segment.Replace("'","''"))'"
  $i++
}
Set-Content -LiteralPath $list -Value $lines -Encoding ascii
$picture=Join-Path $work 'picture.mp4'
& ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $list -c copy $picture
if($LASTEXITCODE -ne 0){throw 'Video concatenation failed'}

$final=Join-Path $out 'PayTrace-Recover-Submission-Cut.mp4'
& ffmpeg -hide_banner -loglevel error -y -i $picture -c copy -movflags +faststart $final
if($LASTEXITCODE -ne 0){throw 'Final video encode failed'}
Write-Output $final
