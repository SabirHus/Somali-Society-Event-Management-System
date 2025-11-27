# scripts/stripe/trigger.ps1
#
# DESCRIPTION: Triggers a simulated 'checkout.session.completed' Stripe webhook event.
# This requires the 'listen.ps1' script to be running in a separate terminal.
#
# USAGE: Run from PowerShell to simulate a successful payment.
#
# ====================================================================

# Terminate script immediately if any command fails
$ErrorActionPreference = 'Stop'

# --- Configuration ---

# ⭐ IMPORTANT: SET YOUR LOCAL STRIPE CLI PATH HERE ⭐
$Exe = 'C:\stripe.exe'   

# --- Execution ---

if (-not (Test-Path $Exe)) { throw "Stripe CLI not found at $Exe" }

Write-Host "Triggering 'checkout.session.completed' webhook event..."
Write-Host "Ensure the 'listen.ps1' script is running in a separate window."

# Execute the Stripe trigger command
& $Exe trigger checkout.session.completed

Write-Host "Webhook trigger sent successfully."