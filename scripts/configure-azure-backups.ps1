param(
  [string]$ResourceGroup = 'provenance-pilot-rg',
  [string]$AppName = 'paytrace-recover-sagitta'
)
$ErrorActionPreference = 'Stop'
$settingsJson = az webapp config appsettings list --resource-group $ResourceGroup --name $AppName --output json
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Azure app settings.' }
$settings = $settingsJson | ConvertFrom-Json
$names = @($settings | ForEach-Object { $_.name })
$updates = @()
if ('BACKUP_DIR' -notin $names) { $updates += 'BACKUP_DIR=/home/data/backups' }
if ('BACKUP_ENCRYPTION_KEY' -notin $names) {
  $key = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  $updates += "BACKUP_ENCRYPTION_KEY=$key"
}
if ($updates.Count -eq 0) { Write-Output 'Backup settings already present; existing key preserved.'; exit 0 }
az webapp config appsettings set --resource-group $ResourceGroup --name $AppName --settings $updates --output none
if ($LASTEXITCODE -ne 0) { throw 'Could not save Azure backup settings.' }
Write-Output 'Backup settings saved. No key value was printed. Confirm a restore probe in Recovery Center > Operations.'
