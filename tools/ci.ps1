$ErrorActionPreference = "Stop"

function Wait-Port {
  param(
    [Parameter(Mandatory=$true)][string]$HostName,
    [Parameter(Mandatory=$true)][int]$Port,
    [int]$TimeoutSeconds = 10
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $iar = $client.BeginConnect($HostName, $Port, $null, $null)
      if ($iar.AsyncWaitHandle.WaitOne(300)) {
        $client.EndConnect($iar) | Out-Null
        $client.Close()
        return
      }
      $client.Close()
    } catch {
    }
    Start-Sleep -Milliseconds 200
  }

  throw "Port $($HostName):$Port is not ready within ${TimeoutSeconds}s"
}

Push-Location (Join-Path $PSScriptRoot "..\\backend")
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pip-audit
pip-audit -r requirements.txt
python -m pytest -q --cov=app --cov-config=.coveragerc --cov-report=xml:coverage.xml --cov-report=term-missing
Pop-Location

Push-Location (Join-Path $PSScriptRoot "..\\frontend")
npm.cmd ci
npm.cmd run test:coverage
npm.cmd run build
npm.cmd audit --audit-level=high

$port = 4177
$server = Start-Process -FilePath "npm.cmd" -ArgumentList @("exec", "--", "http-server", "dist", "-p", "$port", "--gzip", "--brotli", "--silent") -PassThru
try {
  Wait-Port -HostName "127.0.0.1" -Port $port -TimeoutSeconds 12
  npm.cmd exec -- lighthouse "http://127.0.0.1:$port/" --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=lighthouse-report.json --quiet --no-enable-error-reporting
  node tools/assert-lighthouse.mjs lighthouse-report.json
} finally {
  try {
    if ($server -and -not $server.HasExited) {
      Stop-Process -Id $server.Id
    }
  } catch {
  }
}
Pop-Location
