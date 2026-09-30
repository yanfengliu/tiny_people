# Pure PowerShell consumer of the same {id,parent,creation} acquisition contract.
# The caller supplies a live parent and a previously acquired parent identity.
function Test-TaskOwnedDescendant {
  param($Child, $LiveParent, $RecordedParent, $TaskRoot)
  if (-not $Child -or -not $LiveParent -or -not $RecordedParent -or -not $TaskRoot) { return $false }
  foreach ($value in @($Child.id, $Child.parent, $LiveParent.id, $RecordedParent.id, $TaskRoot.id)) {
    if (($value -isnot [int] -and $value -isnot [long]) -or $value -le 0 -or $value -gt 4294967295) { return $false }
  }
  if ($Child.id -eq $Child.parent -or $Child.id -eq $TaskRoot.id -or $Child.parent -ne $LiveParent.id -or $LiveParent.id -ne $RecordedParent.id) { return $false }
  $births = @()
  foreach ($creation in @($Child.creation, $LiveParent.creation, $RecordedParent.creation, $TaskRoot.creation)) {
    if ($creation -isnot [string] -or $creation -notmatch '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})$') { return $false }
    $parsed = [DateTimeOffset]::MinValue
    if (-not [DateTimeOffset]::TryParse($creation, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$parsed)) { return $false }
    $births += $parsed.UtcTicks
  }
  $childBirth, $parentBirth, $recordedBirth, $rootBirth = $births
  if ($parentBirth -ne $recordedBirth) { return $false }
  if ($LiveParent.id -eq $TaskRoot.id -and $parentBirth -ne $rootBirth) { return $false }
  if ($childBirth -lt $rootBirth -or $childBirth -lt $parentBirth -or $parentBirth -lt $rootBirth) { return $false }
  return $true
}
