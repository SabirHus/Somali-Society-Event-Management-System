# scripts/stripe/listen.ps1
#
# DESCRIPTION: Starts the Stripe CLI webhook listener and automatically
# updates the server/.env file with the generated STRIPE_WEBHOOK_SECRET.
#
# USAGE: Run from PowerShell (e.g., in VS Code integrated terminal).
#
# ====================================================================

# Terminate script immediately if any command fails
$ErrorActionPreference = 'Stop'

# --- Configuration ---

# ⭐ IMPORTANT: SET YOUR LOCAL STRIPE CLI PATH HERE ⭐
$Exe = 'C:\stripe.exe'   

# Define file paths using relative paths
$EnvFile = Join-Path $PSScriptRoot '..\..\server\.env' | Resolve-Path
$ForwardTo = 'http://localhost:4000/webhooks/stripe'
$Events    = 'checkout.session.completed' # Only listen for completed checkouts

# --- Validation ---

if (-not (Test-Path $Exe)) { throw "Stripe CLI not found at $Exe" }
# Ensure the .env file exists before attempting to read/write
if (-not (Test-Path $EnvFile)) { New-Item -ItemType File -Path $EnvFile | Out-Null }

# --- Execution ---

Write-Host "--- 1. Checking Stripe CLI Status ---"
# Attempt to log in if the CLI is not already authorized
try { & $Exe status | Out-Null } catch { & $Exe login }

Write-Host "--- 2. Starting Listener and Generating Secret ---"
# Get a fresh webhook secret from the listener command
$secret = & $Exe listen --print-secret
if (-not $secret -or $secret -notmatch '^whsec_') { throw "Failed to get webhook secret: $secret" }

# --- Update .env File ---

Write-Host "--- 3. Updating .env File ---"
# 1. Read existing content
$content = Get-Content $EnvFile -Raw -ErrorAction SilentlyContinue

# 2. Remove any existing STRIPE_WEBHOOK_SECRET line
$content = ($content -replace '^\s*STRIPE_WEBHOOK_SECRET\s*=.*\s*','')

# 3. Append the new secret (ensuring a newline if needed)
if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) { $content += "`n" }
$content += "STRIPE_WEBHOOK_SECRET=$secret`n"
Set-Content -Path $EnvFile -Value $content -NoNewline

Write-Host "Wrote STRIPE_WEBHOOK_SECRET to $EnvFile"

# --- Run Listener ---

Write-Host "--- 4. Running Webhook Listener ---"
Write-Host "Forwarding $Events -> $ForwardTo (Press Ctrl+C to stop)"
& $Exe listen --events $Events --forward-to $ForwardTo