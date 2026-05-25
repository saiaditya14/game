param(
  [Parameter(Mandatory = $true)]
  [string]$SupabaseAnonKey,

  [Parameter(Mandatory = $true)]
  [string]$GeminiApiKey,

  [string]$SupabaseUrl = "http://127.0.0.1:54321",
  [string]$GeminiModel = "gemini-2.5-flash"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SupabaseDir = Join-Path $Root "supabase"
$FrontendEnv = Join-Path $Root ".env.local"
$FunctionEnv = Join-Path $SupabaseDir ".env.local"

function Require-Command {
  param([string]$Name)

  $Command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $Command) {
    throw "Missing '$Name'. Install it, then run this script again."
  }

  return $Command.Source
}

function Write-Utf8NoBom {
  param(
    [string]$Path,
    [string]$Value
  )

  $Directory = Split-Path -Parent $Path
  if ($Directory -and -not (Test-Path $Directory)) {
    New-Item -ItemType Directory -Path $Directory | Out-Null
  }

  [System.IO.File]::WriteAllText($Path, $Value, [System.Text.UTF8Encoding]::new($false))
}

Set-Location $Root

if (-not (Test-Path $SupabaseDir)) {
  $SupabaseCmd = Require-Command "supabase"
  & $SupabaseCmd init
}

Write-Utf8NoBom -Path $FrontendEnv -Value @"
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$SupabaseAnonKey
"@

Write-Utf8NoBom -Path $FunctionEnv -Value @"
GEMINI_API_KEY=$GeminiApiKey
GEMINI_MODEL=$GeminiModel
"@

Write-Host ""
Write-Host "Draw Off local env files updated."
Write-Host "Frontend env: $FrontendEnv"
Write-Host "Function env: $FunctionEnv"
Write-Host ""
Write-Host "Next commands when you want to run locally:"
Write-Host "supabase start"
Write-Host "supabase functions serve judge-drawing --env-file supabase/.env.local"
Write-Host "npm run dev"
