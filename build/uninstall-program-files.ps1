param([Parameter(Mandatory=$true)][string]$InstallDir)
$ErrorActionPreference = 'Stop'
try {
    $root = [IO.Path]::GetFullPath($InstallDir).TrimEnd([char]92)
    if (-not [IO.Directory]::Exists($root)) { exit 0 }
    $manifestPath = Join-Path $root 'app-files-manifest.json'
    if (-not [IO.File]::Exists($manifestPath)) {
        # Legacy installs have no trustworthy inventory. Retain their resources and all user files.
        Write-Output 'No program manifest: legacy files were retained. No recursive cleanup was attempted.'
        exit 0
    }
    if ((Get-Item -LiteralPath $manifestPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Invalid manifest link' }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.schema -ne 1 -or -not $manifest.files -or @($manifest.files).Count -gt 100000) { throw 'Invalid program manifest' }
    $validated = New-Object System.Collections.Generic.List[object]
    foreach ($entry in @($manifest.files)) {
        $relative = [string]$entry.path
        if (-not $relative -or $relative -match '^[\\/]|:|[\x00-\x1f]' -or ($relative -split '[\\/]') -contains '..' -or [string]$entry.sha256 -notmatch '^[a-fA-F0-9]{64}$') { throw 'Unsafe program manifest entry' }
        $destination = [IO.Path]::GetFullPath((Join-Path $root $relative))
        if (-not $destination.StartsWith($root + [char]92, [StringComparison]::OrdinalIgnoreCase)) { throw 'Program manifest escaped install directory' }
        # Preserve data folders in place, including legacy webapp/app layouts.
        if ($relative -match '^(?:(?:resources[/\\](?:app|webapp)[/\\]))?(?:user|user-data|data|output|projects|Canvas Project|Canvas Files|AI CanvasPro Files)(?:[/\\]|$)') { continue }
        $current = $destination
        $linked = $false
        while ($current -and $current -ne $root) {
            if (Test-Path -LiteralPath $current) {
                if ((Get-Item -LiteralPath $current -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { $linked = $true; break }
            }
            $current = [IO.Path]::GetDirectoryName($current)
        }
        if (-not $linked) { $validated.Add(@{ path=$destination; hash=[string]$entry.sha256 }) }
    }
    $directories = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    # Hash through .NET instead of Get-FileHash: the cmdlet lives in an auto-loaded module, and a
    # stripped or shadowed module path hides it. A missing cmdlet must not fail the cleanup.
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    foreach ($entry in $validated) {
        if (-not [IO.File]::Exists($entry.path)) { continue }
        $stream = [IO.File]::OpenRead($entry.path)
        try { $hash = [BitConverter]::ToString($sha256.ComputeHash($stream)).Replace('-', '') }
        finally { $stream.Dispose() }
        if (-not $hash.Equals($entry.hash, [StringComparison]::OrdinalIgnoreCase)) {
            Write-Output 'A modified program file was retained.'
            continue
        }
        Remove-Item -LiteralPath $entry.path -Force -ErrorAction Stop
        $parent = [IO.Path]::GetDirectoryName($entry.path)
        while ($parent -and $parent -ne $root) { [void]$directories.Add($parent); $parent=[IO.Path]::GetDirectoryName($parent) }
    }
    $sha256.Dispose()
    foreach ($directory in @($directories | Sort-Object Length -Descending)) {
        if ([IO.Directory]::Exists($directory) -and @(Get-ChildItem -LiteralPath $directory -Force).Count -eq 0) { [IO.Directory]::Delete($directory) }
    }
    Remove-Item -LiteralPath $manifestPath -Force -ErrorAction Stop
    exit 0
} catch {
    Write-Error 'Program cleanup did not complete. Existing data and modified files were not intentionally deleted.' -ErrorAction Continue
    exit 20
}
