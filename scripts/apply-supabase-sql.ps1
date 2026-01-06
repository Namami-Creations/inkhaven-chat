param(
  [string]$EnvFile = ".env.local",
  [string]$PoolerHost = "ap-south-1.pooler.supabase.com",
  [int]$PoolerPort = 6543,
  [string]$Database = "postgres",
  [string]$User = "",
  [string]$SchemaFile = "database/schema.sql",
  [string]$StorageFile = "database/storage-setup.sql"
)

$ErrorActionPreference = 'Stop'

function Get-PsqlPath {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Path }

  $candidates = @(
    "$env:ProgramFiles\\PostgreSQL\\17\\bin\\psql.exe",
    "$env:ProgramFiles\\PostgreSQL\\16\\bin\\psql.exe",
    "$env:ProgramFiles\\PostgreSQL\\15\\bin\\psql.exe",
    "$env:ProgramFiles\\PostgreSQL\\14\\bin\\psql.exe",
    "$env:ProgramFiles\\PostgreSQL\\13\\bin\\psql.exe"
  )

  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }

  throw "psql not found. Install PostgreSQL or add psql to PATH."
}

function Read-EnvFile([string]$path) {
  if (-not (Test-Path $path)) { throw "Env file not found: $path" }

  $map = @{}
  Get-Content -LiteralPath $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith('#')) { return }

    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }

    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()

    # Strip surrounding quotes
    if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
      $v = $v.Substring(1, $v.Length - 2)
    }

    $map[$k] = $v
  }
  return $map
}

function Get-ProjectRefFromUrl([string]$supabaseUrl) {
  $raw = ''
  if ($null -ne $supabaseUrl) {
    $raw = [string]$supabaseUrl
  }
  $raw = $raw.Trim()
  if (-not $raw) {
    throw "NEXT_PUBLIC_SUPABASE_URL is empty."
  }

  # Normalize common variants: quoted values, trailing slashes, stray control chars.
  $raw = $raw.Trim('"', "'")
  $raw = ($raw -replace "[\r\n\t]", '').Trim()
  $raw = $raw.TrimEnd('/')

  try {
    $uri = [Uri]$raw
    $host = ''
    if ($null -ne $uri -and $null -ne $uri.Host) {
      $host = [string]$uri.Host
    }
    $host = $host.TrimEnd('.').ToLowerInvariant()
    # expected: <ref>.supabase.co
    if ($host -match '^(?<ref>[a-z0-9-]+)\.supabase\.co$') {
      return $Matches['ref']
    }
  } catch {
    # ignore and fall back to regex parsing
  }

  # Fallback: extract from raw URL text
  $rawLower = $raw.ToLowerInvariant()
  if ($rawLower -match '^https?://(?<ref>[a-z0-9-]+)\.supabase\.co') {
    return $Matches['ref']
  }

  throw "Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL ($raw). Expected https://<ref>.supabase.co"
}

function Parse-PostgresUrl([string]$url) {
  if ([string]::IsNullOrWhiteSpace($url)) { return $null }
  $raw = $url.Trim().Trim('"', "'")

  # Supports: postgresql://user:pass@host:port/dbname
  $m = [regex]::Match($raw, '^postgres(?:ql)?:\/\/(?<user>[^:\/\?#]+):(?<pw>[^@\/?#]+)@(?<host>[^:\/\?#]+)(:(?<port>\d+))?\/(?<db>[^\/?#]+)')
  if (-not $m.Success) { return $null }

  $port = 5432
  if ($m.Groups['port'].Success) {
    $port = [int]$m.Groups['port'].Value
  }

  return @{
    User = $m.Groups['user'].Value
    Password = $m.Groups['pw'].Value
    Host = $m.Groups['host'].Value
    Port = $port
    Database = $m.Groups['db'].Value
  }
}

function Invoke-Psql([string]$psqlPath, [string[]]$PsqlArgs) {
  & $psqlPath @PsqlArgs
  if ($LASTEXITCODE -ne 0) {
    throw "psql failed with exit code $LASTEXITCODE"
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $repoRoot

try {
  $envMap = Read-EnvFile (Join-Path $repoRoot $EnvFile)

  if (-not $envMap.ContainsKey('NEXT_PUBLIC_SUPABASE_URL')) {
    throw "Missing NEXT_PUBLIC_SUPABASE_URL in $EnvFile"
  }

  $projectRef = Get-ProjectRefFromUrl $envMap['NEXT_PUBLIC_SUPABASE_URL']

  # Prefer DATABASE_URL when present (it provides the correct host/port/user/db/password).
  $dbConn = $null
  if ($envMap.ContainsKey('DATABASE_URL')) {
    $dbConn = Parse-PostgresUrl $envMap['DATABASE_URL']
  }

  if ($dbConn) {
    $PoolerHost = $dbConn['Host']
    $PoolerPort = $dbConn['Port']
    $Database = $dbConn['Database']
    if ([string]::IsNullOrWhiteSpace($User)) {
      $User = $dbConn['User']
    }
  }

  if ([string]::IsNullOrWhiteSpace($User)) {
    $User = "postgres.$projectRef"
  }

  $psql = Get-PsqlPath

  $schemaPath = Resolve-Path (Join-Path $repoRoot $SchemaFile)
  $storagePath = Resolve-Path (Join-Path $repoRoot $StorageFile)

  # Extract password from DATABASE_URL
  $dbPassword = $null
  if ($dbConn) {
    $dbPassword = $dbConn['Password']
  } elseif ($envMap.ContainsKey('DATABASE_URL')) {
    $dbUrl = $envMap['DATABASE_URL']
    if ($dbUrl -match '^postgresql://[^:]+:([^@]+)@') {
      $dbPassword = $Matches[1]
    }
  }

  Write-Host "Target:" -ForegroundColor Cyan
  Write-Host "  Host: $PoolerHost" -ForegroundColor Cyan
  Write-Host "  Port: $PoolerPort" -ForegroundColor Cyan
  Write-Host "  DB:   $Database" -ForegroundColor Cyan
  Write-Host "  User: $User" -ForegroundColor Cyan
  Write-Host ""

  if ($dbPassword) {
    Write-Host "Using password from DATABASE_URL." -ForegroundColor Green
    $plain = $dbPassword
  } else {
    Write-Host "DATABASE_URL not found (or password couldn't be parsed)." -ForegroundColor Yellow
    Write-Host "Enter your Supabase database password (not the Supabase keys)." -ForegroundColor Yellow
    $secure = Read-Host -Prompt "Password for $User" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }

  try {
    $env:PGSSLMODE = 'require'
    $env:PGHOST = $PoolerHost
    $env:PGPORT = "$PoolerPort"
    $env:PGDATABASE = $Database
    $env:PGUSER = $User
    $env:PGPASSWORD = $plain

    Write-Host "Applying database schema..." -ForegroundColor Cyan
    Invoke-Psql $psql @('-X','-v','ON_ERROR_STOP=1','-f',$schemaPath.Path)

    Write-Host "Applying storage setup..." -ForegroundColor Cyan
    Invoke-Psql $psql @('-X','-v','ON_ERROR_STOP=1','-f',$storagePath.Path)

    # Ensure buckets exist via Storage API (more reliable than direct SQL inserts)
    Write-Host "Ensuring storage buckets via API..." -ForegroundColor Cyan
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
      & $node.Path (Join-Path $repoRoot 'scripts\ensure-storage-buckets.js')
      if ($LASTEXITCODE -ne 0) {
        throw "ensure-storage-buckets.js failed with exit code $LASTEXITCODE"
      }
    } else {
      Write-Host "Node.js not found; skipping ensure-storage-buckets.js" -ForegroundColor Yellow
    }

    Write-Host "Verifying matchmake RPC exists..." -ForegroundColor Cyan
    Invoke-Psql $psql @('-X','-v','ON_ERROR_STOP=1','-c',"select n.nspname as schema, p.proname as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname in ('matchmake','shared_interest_count','current_user_id') order by 1,2;")

    Write-Host "Done." -ForegroundColor Green
  } finally {
    # Best-effort cleanup
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PGHOST -ErrorAction SilentlyContinue
    Remove-Item Env:PGPORT -ErrorAction SilentlyContinue
    Remove-Item Env:PGDATABASE -ErrorAction SilentlyContinue
    Remove-Item Env:PGUSER -ErrorAction SilentlyContinue
  }
} finally {
  Pop-Location
}
