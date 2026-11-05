param(
  [Parameter(Mandatory = $true)][string]$SubscriptionId,
  [string]$ResourceGroup = 'provenance-pilot-rg',
  [string]$AppName = 'paytrace-recover-sagitta',
  [Parameter(Mandatory = $true)][string]$ContainerSasSecretUri
)
$ErrorActionPreference = 'Stop'
if ($ContainerSasSecretUri -notmatch '^https://[a-z0-9-]+\.vault\.azure\.net/secrets/[a-z0-9-]+/[a-f0-9]+$') {
  throw 'Pass a versioned Key Vault secret URI containing a private container SAS URL. The app identity needs secrets/get permission.'
}
$settingsJson = az webapp config appsettings list --subscription $SubscriptionId --resource-group $ResourceGroup --name $AppName --output json
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect Azure app settings.' }
$settings = $settingsJson | ConvertFrom-Json
$reference = "@Microsoft.KeyVault(SecretUri=$ContainerSasSecretUri)"
$current = @($settings | Where-Object { $_.name -eq 'BACKUP_BLOB_CONTAINER_URL' } | Select-Object -First 1)
if ($current.Count -gt 0 -and $current[0].value -eq $reference) {
  Write-Output 'Off-site backup reference already configured.'
  exit 0
}
az webapp config appsettings set --subscription $SubscriptionId --resource-group $ResourceGroup --name $AppName --settings "BACKUP_BLOB_CONTAINER_URL=$reference" --output none
if ($LASTEXITCODE -ne 0) { throw 'Could not save the off-site backup reference.' }
Write-Output 'Off-site backup reference saved. Run a backup, verify offHost=true, then restore a downloaded encrypted copy in a separate environment.'
