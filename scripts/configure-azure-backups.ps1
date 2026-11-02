param(
  [Parameter(Mandatory = $true)][string]$SubscriptionId,
  [string]$ResourceGroup = 'provenance-pilot-rg',
  [string]$AppName = 'paytrace-recover-sagitta',
  [Parameter(Mandatory = $true)][string]$BackupSecretUri
)
$ErrorActionPreference = 'Stop'
if ($BackupSecretUri -notmatch '^https://[a-z0-9-]+\.vault\.azure\.net/secrets/[a-z0-9-]+/[a-f0-9]+$') {
  throw 'Pass a versioned Azure Key Vault secret URI. The app identity must have secrets/get permission.'
}
$settingsJson = az webapp config appsettings list --subscription $SubscriptionId --resource-group $ResourceGroup --name $AppName --output json
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Azure app settings.' }
$settings = $settingsJson | ConvertFrom-Json
$names = @($settings | ForEach-Object { $_.name })
$updates = @()
if ('BACKUP_DIR' -notin $names) { $updates += 'BACKUP_DIR=/home/data/backups' }
$reference = "@Microsoft.KeyVault(SecretUri=$BackupSecretUri)"
$current = @($settings | Where-Object { $_.name -eq 'BACKUP_ENCRYPTION_KEY' } | Select-Object -First 1)
if ($current.Count -eq 0 -or $current[0].value -ne $reference) { $updates += "BACKUP_ENCRYPTION_KEY=$reference" }
if ($updates.Count -eq 0) { Write-Output 'Backup settings already present; existing key preserved.'; exit 0 }
az webapp config appsettings set --subscription $SubscriptionId --resource-group $ResourceGroup --name $AppName --settings $updates --output none
if ($LASTEXITCODE -ne 0) { throw 'Could not save Azure backup settings.' }
Write-Output 'Backup settings saved using a Key Vault reference. Confirm the app identity can resolve it, then run a restore probe in Recovery Center > Operations.'
