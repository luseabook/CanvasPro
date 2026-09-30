param([Parameter(Mandatory=$true)][string]$InstallDir, [Parameter(Mandatory=$true)][string]$ExecutableName)
$ErrorActionPreference = 'Stop'
try {
    if ([string]::IsNullOrWhiteSpace($InstallDir)) { exit 20 }
    $root = [IO.Path]::GetFullPath($InstallDir).TrimEnd([char]92) + [char]92
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $running = $false
        foreach ($process in @(Get-CimInstance -ClassName Win32_Process -ErrorAction Stop)) {
            if ($process.ExecutablePath) {
                $exe = [IO.Path]::GetFullPath([string]$process.ExecutablePath)
                if ($exe.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { $running = $true }
            } elseif ($process.Name -eq $ExecutableName) {
                # Insufficient visibility is not permission to terminate or overwrite another process.
                exit 20
            }
        }
        if (-not $running) { exit 0 }
        Start-Sleep -Milliseconds 500
    }
    exit 10
} catch { exit 20 }
