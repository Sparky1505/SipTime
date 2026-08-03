param(
  [string]$ExpectedTag = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (
  Resolve-Path (
    Join-Path $PSScriptRoot ".."
  )
).Path

Push-Location $repoRoot

try {
  Write-Host "Building extension..."
  & npm run build:extension

  if ($LASTEXITCODE -ne 0) {
    throw "Extension build failed with exit code $LASTEXITCODE."
  }

  Write-Host "Verifying release contents..."

  if (
    [string]::IsNullOrWhiteSpace(
      $ExpectedTag
    )
  ) {
    & npm run release:verify
  } else {
    & npm run release:verify -- $ExpectedTag
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Release verification failed with exit code $LASTEXITCODE."
  }

  $packageJson = Get-Content `
    -LiteralPath ".\package.json" `
    -Raw |
    ConvertFrom-Json

  $version = [string]$packageJson.version

  if (
    $version -notmatch
    '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$'
  ) {
    throw "Invalid package version: $version"
  }

  $distPath = Join-Path `
    $repoRoot `
    "dist-extension"

  $releaseDirectory = Join-Path `
    $repoRoot `
    "releases"

  New-Item `
    -ItemType Directory `
    -Path $releaseDirectory `
    -Force |
    Out-Null

  $archiveName =
    "SipTime-v$version-chrome.zip"

  $archivePath = Join-Path `
    $releaseDirectory `
    $archiveName

  $checksumPath = Join-Path `
    $releaseDirectory `
    "SHA256SUMS.txt"

  Remove-Item `
    -LiteralPath $archivePath `
    -Force `
    -ErrorAction SilentlyContinue

  Remove-Item `
    -LiteralPath $checksumPath `
    -Force `
    -ErrorAction SilentlyContinue

  Write-Host "Creating Chrome Web Store ZIP..."

  Compress-Archive `
    -Path (
      Join-Path $distPath "*"
    ) `
    -DestinationPath $archivePath `
    -CompressionLevel Optimal

  Add-Type `
    -AssemblyName `
    System.IO.Compression.FileSystem

  $archive = [System.IO.Compression.ZipFile]::OpenRead(
    $archivePath
  )

  try {
    $entryNames = @(
      $archive.Entries |
      ForEach-Object {
        $_.FullName.Replace(
          "\",
          "/"
        )
      }
    )

    $requiredRootEntries = @(
      "manifest.json",
      "popup.html",
      "options.html",
      "background.js",
      "icon.png"
    )

    foreach (
      $requiredEntry in
      $requiredRootEntries
    ) {
      if (
        $entryNames -notcontains
        $requiredEntry
      ) {
        throw "Packaged ZIP is missing root entry: $requiredEntry"
      }
    }

    if (
      $entryNames |
      Where-Object {
        $_ -like
        "dist-extension/*"
      }
    ) {
      throw "The ZIP contains an unexpected dist-extension parent folder."
    }
  } finally {
    $archive.Dispose()
  }

  $hash = (
    Get-FileHash `
      -LiteralPath $archivePath `
      -Algorithm SHA256
  ).Hash.ToLowerInvariant()

  "$hash  $archiveName" |
    Set-Content `
      -LiteralPath $checksumPath `
      -Encoding ASCII

  $archiveDetails =
    Get-Item `
      -LiteralPath $archivePath

  Write-Host ""
  Write-Host "Release package created successfully."
  Write-Host "Version: v$version"
  Write-Host "ZIP: $archivePath"
  Write-Host "Size: $($archiveDetails.Length) bytes"
  Write-Host "SHA-256: $hash"
  Write-Host "Checksum: $checksumPath"
} finally {
  Pop-Location
}
