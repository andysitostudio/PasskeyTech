# Publica una nueva version de PasskeyTech y VERIFICA que GitHub quede con todos los archivos.
# Ejecutalo desde la carpeta del proyecto, sin nada mas, y te pregunta todo lo que haga falta:
#   powershell -ExecutionPolicy Bypass -File .\publicar.ps1
#
# El token de GitHub se pide la primera vez y despues queda guardado, cifrado, junto al
# proyecto (archivo .gh-token: solo lo puede leer tu usuario de Windows en esta PC). Las
# veces siguientes no hace falta pegarlo de nuevo. Para olvidarlo, borra ese archivo.
#
# Tambien puedes seguir usando los mismos parametros de antes si prefieres no ver el menu:
#   powershell -ExecutionPolicy Bypass -File .\publicar.ps1 -Tipo minor        (1.1.1 -> 1.2.0)
#   powershell -ExecutionPolicy Bypass -File .\publicar.ps1 -Tipo major        (1.2.0 -> 2.0.0)
#   powershell -ExecutionPolicy Bypass -File .\publicar.ps1 -Version 26.0.0    salta a la version que quieras (debe ser MAYOR)
#   powershell -ExecutionPolicy Bypass -File .\publicar.ps1 -Reintentar        vuelve a subir la version actual SIN cambiar el numero
param(
  [ValidateSet('patch','minor','major','')][string]$Tipo = '',
  [string]$Version = '',
  [switch]$Reintentar
)
$ErrorActionPreference = 'Stop'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
Set-Location $PSScriptRoot

$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pub = $pkg.build.publish[0]
if ($pub.owner -like 'TU-USUARIO*') {
  Write-Host "Antes de publicar, cambia 'owner' y 'repo' en package.json (seccion build > publish) por tu usuario y tu repositorio de GitHub." -ForegroundColor Red
  exit 1
}
$actual = $pkg.version

Write-Host ''
Write-Host "Version actual: $actual" -ForegroundColor Cyan
if ($pkg.displayVersion) { Write-Host "  (se le muestra a los usuarios como: $($pkg.displayVersion))" -ForegroundColor DarkGray }

if ($Reintentar -and ($Version -ne '')) {
  Write-Host "No combines -Reintentar con -Version." -ForegroundColor Red
  exit 1
}

# Si no diste ningun parametro, se pregunta en pantalla a que version pasar
if (-not $Reintentar -and $Version -eq '' -and $Tipo -eq '') {
  $p0 = @($actual.Split('.') | ForEach-Object { [int]$_ })
  $sugPatch = ('{0}.{1}.{2}' -f $p0[0], $p0[1], ($p0[2] + 1))
  $sugMinor = ('{0}.{1}.0' -f $p0[0], ($p0[1] + 1))
  $sugMajor = ('{0}.0.0' -f ($p0[0] + 1))
  Write-Host ''
  Write-Host 'A que version quieres pasar?'
  Write-Host "  1) $sugPatch   (sube solo el ultimo numero)"
  Write-Host "  2) $sugMinor   (sube el numero del medio)"
  Write-Host "  3) $sugMajor   (sube el primer numero)"
  Write-Host '  4) Escribir la version exacta que quiera'
  Write-Host "  5) Reintentar la $actual sin cambiar el numero (por si la ultima publicacion quedo a medias)"
  $op = (Read-Host 'Elige 1-5').Trim()
  switch ($op) {
    '1' { $Tipo = 'patch' }
    '2' { $Tipo = 'minor' }
    '3' { $Tipo = 'major' }
    '4' { $Version = (Read-Host 'Escribe la version (3 numeros, ej: 2.5.0)').Trim() }
    '5' { $Reintentar = $true }
    default { Write-Host 'No elegiste una opcion valida (1 a 5). No se publico nada.' -ForegroundColor Red; exit 0 }
  }
}
if ($Tipo -eq '' -and $Version -eq '' -and -not $Reintentar) { $Tipo = 'patch' }   # por si lo llamaste con parametros raros

# Si pediste una version exacta, se revisa antes de tocar nada
if ($Version -ne '') {
  if ($Version -notmatch '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$') {
    Write-Host "La version debe tener 3 numeros separados por puntos y sin ceros a la izquierda. Ejemplos: 26.0.0  o  2026.9.0  (no sirve 2026.09.0 ni 26.0)." -ForegroundColor Red
    Write-Host "Si lo que quieres es que a los usuarios les aparezca como '7.0' en vez de '7.0.0', eso se hace aparte con 'displayVersion' en package.json (la version interna sigue necesitando 3 numeros)." -ForegroundColor DarkGray
    exit 1
  }
  if ([version]$Version -le [version]$actual) {
    Write-Host "La version $Version no es mayor que la actual ($actual). Los usuarios solo se actualizan hacia una version MAYOR, asi que nadie la recibiria." -ForegroundColor Red
    exit 1
  }
}

# Version que se va a publicar (se calcula antes de tocar nada)
if ($Reintentar) { $objetivo = $actual }
elseif ($Version -ne '') { $objetivo = $Version }
else {
  $p = @($actual.Split('.') | ForEach-Object { [int]$_ })
  if ($Tipo -eq 'major') { $objetivo = ('{0}.0.0' -f ($p[0] + 1)) }
  elseif ($Tipo -eq 'minor') { $objetivo = ('{0}.{1}.0' -f $p[0], ($p[1] + 1)) }
  else { $objetivo = ('{0}.{1}.{2}' -f $p[0], $p[1], ($p[2] + 1)) }
}

if (-not $Reintentar) {
  Write-Host ''
  Write-Host "Vas a pasar de $actual a $objetivo." -ForegroundColor Yellow
  Write-Host "Los usuarios que la reciban NO podran volver a una version menor. Publica siempre en orden creciente." -ForegroundColor Yellow
  $r = Read-Host 'Continuar? (s/n)'
  if ($r -notmatch '^[sS]') { Write-Host 'Cancelado. No se publico nada.'; exit 0 }
}

# Las novedades de esa version deben estar escritas en novedades.js (es lo que ven los usuarios al actualizar).
# Si hay displayVersion (ej. "7.0" en vez de "7.0.0"), novedades.js tiene que usar ESE numero, porque es el
# que se le muestra a los usuarios y con el que la app busca su propia entrada del changelog.
$versionParaNovedades = if ($pkg.displayVersion) { $pkg.displayVersion } else { $objetivo }
$hayNovedades = $false
if (Test-Path novedades.js) {
  $patron = 'version:\s*[''"]' + [regex]::Escape($versionParaNovedades) + '[''"]'
  $hayNovedades = ((Get-Content novedades.js -Raw) -match $patron)
}
if (-not $hayNovedades) {
  Write-Host "No encontre en novedades.js una entrada con version: '$versionParaNovedades'." -ForegroundColor Yellow
  Write-Host "Sin eso, tus usuarios NO veran la ventana 'Novedades de PasskeyTech $versionParaNovedades' al actualizar." -ForegroundColor Yellow
  $r2 = Read-Host 'Publicar de todos modos? (s/n)'
  if ($r2 -notmatch '^[sS]') { Write-Host 'Cancelado. Agrega el bloque en novedades.js y vuelve a ejecutar. No se publico nada.'; exit 0 }
}

# ---------- Token de GitHub: se pide una vez y se guarda cifrado para no pegarlo cada vez ----------
$tokenFile = Join-Path $PSScriptRoot '.gh-token'
function Get-SavedToken {
  if (-not (Test-Path $tokenFile)) { return $null }
  try {
    $secure = Get-Content $tokenFile -Raw | ConvertTo-SecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return ([Runtime.InteropServices.Marshal]::PtrToStringUni($bstr)).Trim() }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  } catch {
    Write-Host "No pude leer el token guardado (.gh-token es de otro usuario o de otra PC). Lo vuelvo a pedir." -ForegroundColor DarkYellow
    return $null
  }
}
function Save-Token([string]$t) {
  try {
    $enc = (ConvertTo-SecureString $t -AsPlainText -Force) | ConvertFrom-SecureString
    Set-Content -Path $tokenFile -Value $enc -NoNewline
    Write-Host "Token guardado (cifrado, solo tu lo puedes usar en esta PC) en .gh-token. La proxima vez no hace falta pegarlo." -ForegroundColor DarkGray
  } catch {
    Write-Host "No pude guardar el token para la proxima vez (no es grave, se va a volver a pedir)." -ForegroundColor DarkYellow
  }
}

if (-not $env:GH_TOKEN) { $env:GH_TOKEN = Get-SavedToken }
$tokenEraNuevo = $false
if (-not $env:GH_TOKEN) {
  $seguro = Read-Host 'Pega tu token de GitHub (se va a guardar cifrado para la proxima vez)' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
  try {
    # PtrToStringUni (no "Auto"): SecureStringToBSTR siempre entrega UTF-16, y en Windows PowerShell 5.1
    # "Auto" reinterpreta esos bytes como ANSI y agrega un caracter invalido al final del token.
    $env:GH_TOKEN = ([Runtime.InteropServices.Marshal]::PtrToStringUni($bstr)).Trim()
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
  $tokenEraNuevo = $true
}
if ($env:GH_TOKEN -notmatch '^[.\w/=+-]+$') {
  Write-Host "El token tiene caracteres no validos (revisa que no quedara un espacio o un salto de linea al pegarlo)." -ForegroundColor Red
  if (Test-Path $tokenFile) { Remove-Item $tokenFile -ErrorAction SilentlyContinue }
  exit 1
}

if ($Reintentar) {
  $nueva = $actual
  Write-Host "Reintentando subir la version $nueva (el numero no cambia)." -ForegroundColor Cyan
} else {
  npm version $objetivo --no-git-tag-version | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host "npm no pudo cambiar el numero de version." -ForegroundColor Red; exit 1 }
  $nueva = (Get-Content package.json -Raw | ConvertFrom-Json).version
}

# Archivos que DEBE tener la release en GitHub para que la app pueda actualizarse
$patron = $pkg.build.artifactName
if (-not $patron) { $patron = '${productName}-Setup-${version}.${ext}' }
$exe = $patron.Replace('${version}', $nueva).Replace('${ext}', 'exe').Replace('${productName}', $pkg.build.productName)
$requeridos = @($exe, ($exe + '.blockmap'), 'latest.yml')

$api = 'https://api.github.com'
if ($env:PASSKEY_API) { $api = $env:PASSKEY_API }
$base = $api + '/repos/' + $pub.owner + '/' + $pub.repo
$hdr = @{ Authorization = ('Bearer ' + $env:GH_TOKEN); Accept = 'application/vnd.github+json'; 'User-Agent' = 'passkeytech-publicar' }
$script:apiOk = $true

function Get-Assets {
  try {
    $rels = Invoke-RestMethod -Uri ($base + '/releases?per_page=30') -Headers $hdr
    $rel = $rels | Where-Object { $_.tag_name -eq ('v' + $nueva) } | Select-Object -First 1
    if ($rel) { return @($rel.assets) }
  } catch {
    $script:apiOk = $false
    Write-Host ('  (No pude consultar GitHub: ' + $_.Exception.Message + ')') -ForegroundColor DarkYellow
  }
  return @()
}
function Get-Missing {
  $script:apiOk = $true
  $assets = @(Get-Assets)
  $listos = @($assets | Where-Object { $_.state -eq 'uploaded' -and $_.size -gt 0 } | ForEach-Object { $_.name })
  return @($requeridos | Where-Object { $listos -notcontains $_ })
}
function Remove-Incomplete {
  foreach ($a in @(Get-Assets)) {
    if ($a.state -ne 'uploaded' -or $a.size -eq 0) {
      try {
        Invoke-RestMethod -Method Delete -Uri ($base + '/releases/assets/' + $a.id) -Headers $hdr | Out-Null
        Write-Host ('  Elimine un archivo incompleto de GitHub: ' + $a.name)
      } catch {}
    }
  }
}

if (Test-Path dist) { Remove-Item -Recurse -Force dist }
$maxIntentos = 3
$faltan = @($requeridos)
for ($i = 1; $i -le $maxIntentos; $i++) {
  Write-Host "Publicando PasskeyTech $nueva (intento $i de $maxIntentos) ..." -ForegroundColor Cyan
  npm run release
  $codigo = $LASTEXITCODE
  Start-Sleep -Seconds 3
  $faltan = @(Get-Missing)
  # Si no se pudo consultar GitHub, se confia en el resultado de npm
  if ($codigo -eq 0 -and (($faltan.Count -eq 0) -or (-not $script:apiOk))) { $faltan = @(); break }
  Write-Host ("Intento $i incompleto. Faltan en GitHub: " + ($faltan -join ', ')) -ForegroundColor Yellow
  Remove-Incomplete
  if ($i -lt $maxIntentos) { Write-Host 'Reintentando en 10 segundos ...'; Start-Sleep -Seconds 10 }
}

if ($faltan.Count -eq 0) {
  if ($tokenEraNuevo) { Save-Token $env:GH_TOKEN }   # recien ahora que sabemos que el token sirvio de verdad
  if ($script:apiOk) {
    Write-Host "Listo: PasskeyTech $nueva publicada con todos sus archivos. Los usuarios la recibiran solos." -ForegroundColor Green
  } else {
    Write-Host "npm termino sin errores, pero no pude comprobar GitHub desde aqui. Abre la release de $nueva y confirma que tenga el instalador y latest.yml (5 assets en total)." -ForegroundColor Yellow
  }
} else {
  Write-Host "NO se pudo completar la publicacion de $nueva. Faltan en GitHub: $($faltan -join ', ')" -ForegroundColor Red
  Write-Host "Revisa el error que mostro npm arriba (conexion, antivirus, token). Luego ejecuta:  .\publicar.ps1 -Reintentar" -ForegroundColor Red
  exit 1
}
