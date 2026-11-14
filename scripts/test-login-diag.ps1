$ErrorActionPreference = 'Stop'

Write-Host "=========================================="
Write-Host "DIAGNOSING BACKEND LOGIN (Port 8080)"
Write-Host "=========================================="

$body = @{
    email = "admin@rohilla.com"
    password = "password123"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "[SUCCESS] Backend Login Response:"
    Write-Host ($res | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "[FAIL] Error from Backend: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "DIAGNOSING FRONTEND PROXY LOGIN (Port 5173)"
Write-Host "=========================================="

try {
    $res2 = Invoke-RestMethod -Uri "http://localhost:5173/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "[SUCCESS] Frontend Proxy Login Response:"
    Write-Host ($res2 | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "[FAIL] Error from Frontend Proxy: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
