$sourcePath = Join-Path $PSScriptRoot 'bhoomiSetu_postgresql.sql'
$sql = Get-Content -Raw -LiteralPath $sourcePath

$sql = $sql -replace '-- Import with:\r?\n--   mysql --default-character-set=utf8mb4 -u <user> -p < bhoomiSetuDb.sql', "-- Import with:`r`n--   psql -U <user> -d <database> -f bhoomiSetu_postgresql.sql"
$sql = $sql -replace "CREATE DATABASE IF NOT EXISTS bhoomiSetuDb\s+CHARACTER SET utf8mb4\s+COLLATE utf8mb4_0900_ai_ci;\s*\r?\n\s*USE bhoomiSetuDb;\s*\r?\n\s*SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;\s*\r?\n\s*SET time_zone = '\+00:00';", "CREATE EXTENSION IF NOT EXISTS postgis;`r`nSET TIME ZONE 'UTC';"
$sql = $sql -replace 'JSONBB', 'JSONB'
$sql = $sql -replace 'SMALLINTEGER', 'SMALLINT'
$sql = $sql -replace 'BIGINTEGER', 'BIGINT'
$sql = $sql -replace 'boundary_wgs84 GEOMETRY NOT NULL SRID 4326', 'boundary_wgs84 geometry(Geometry, 4326) NOT NULL'
$sql = $sql -replace "\s+COMMENT\s+'[^']*'", ''
$sql = $sql -replace '\r?\n\s*ON UPDATE CASCADE,', ','
$sql = $sql -replace '\r?\n\s*ON UPDATE CASCADE', ''
$sql = $sql -replace 'ON CONFLICT \(role_code\) DO UPDATE SET\r?\n  display_name = EXCLUDED.display_name,\r?\n  description = EXCLUDED.description,\r?\n  is_publicly_visible = EXCLUDED.is_publicly_visible;', "ON CONFLICT (document_type_code) DO UPDATE SET`r`n  display_name = EXCLUDED.display_name,`r`n  description = EXCLUDED.description,`r`n  is_publicly_visible = EXCLUDED.is_publicly_visible;"
$sql = $sql -replace 'ON CONFLICT \(role_code\) DO UPDATE SET\r?\n  stage_order = VALUES\(stage_order\),\r?\n  display_name = EXCLUDED.display_name,\r?\n  display_name_local = VALUES\(display_name_local\),\r?\n  description = EXCLUDED.description,\r?\n  default_sla_days = VALUES\(default_sla_days\),\r?\n  is_terminal = VALUES\(is_terminal\);', "ON CONFLICT (stage_code) DO UPDATE SET`r`n  stage_order = EXCLUDED.stage_order,`r`n  display_name = EXCLUDED.display_name,`r`n  display_name_local = EXCLUDED.display_name_local,`r`n  description = EXCLUDED.description,`r`n  default_sla_days = EXCLUDED.default_sla_days,`r`n  is_terminal = EXCLUDED.is_terminal;"

$lines = $sql -split '\r?\n'
$output = [System.Collections.Generic.List[string]]::new()
$indexes = [System.Collections.Generic.List[string]]::new()
$currentTable = $null
$insideTable = $false

foreach ($line in $lines) {
  if ($line -match '^CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)\s*\(') {
    $currentTable = $Matches[1]
    $insideTable = $true
  }

  if ($insideTable -and $line -match '^\s*SPATIAL KEY\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\),?\s*$') {
    $indexes.Add("CREATE INDEX IF NOT EXISTS $($Matches[1]) ON $currentTable USING GIST ($($Matches[2]));")
    continue
  }

  if ($insideTable -and $line -match '^\s*KEY\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\),?\s*$') {
    $indexes.Add("CREATE INDEX IF NOT EXISTS $($Matches[1]) ON $currentTable ($($Matches[2]));")
    continue
  }

  if ($line -match '^\s*\);\s*$') {
    $insideTable = $false
    $currentTable = $null
  }

  $output.Add($line)
}

$normalized = ($output -join "`r`n")
$normalized = $normalized -replace 'UNIQUE KEY\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)(,?)', 'CONSTRAINT $1 UNIQUE ($2)$3'
$normalized = $normalized -replace ',\r?\n\s*\);', "`r`n);"
$normalized = [regex]::Replace($normalized, '(?s)INSERT IGNORE INTO\s+(.*?);', 'INSERT INTO $1 ON CONFLICT DO NOTHING;')
$normalized = $normalized -replace '\r?\n\r?\n\r?\n+', "`r`n`r`n"
$normalized += "`r`n`r`n-- Non-unique indexes converted from the source schema.`r`n"
$normalized += ($indexes -join "`r`n")
$normalized += "`r`n"

Set-Content -LiteralPath $sourcePath -Value $normalized -Encoding utf8
Write-Output "Normalized $sourcePath and emitted $($indexes.Count) indexes."
