$ErrorActionPreference = 'Stop'

Write-Host 'Testing Requests Through Frontend Vite Proxy (http://localhost:5173)...'

# 1. Test Login via Frontend Proxy
$loginJson = @{
    email = 'admin@rohilla.com'
    password = 'password123'
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri 'http://localhost:5173/api/v1/auth/login' -Method Post -Body $loginJson -ContentType 'application/json'
    Write-Host " [+] Frontend Proxy Login SUCCESS! User: $($loginRes.data.user.fullName), Role: $($loginRes.data.user.roles -join ', ')"
} catch {
    Write-Host " [-] Frontend Proxy Login FAILED! Error: $_"
}

# 2. Test Public Quote via Frontend Proxy
$quoteJson = @{
    name = 'Test Customer Proxy'
    phone = '9810002222'
    productService = '3D Acrylic & LED Signage'
    quantity = 2
    size = '8x3'
    location = 'Rishikesh'
    requirement = 'Testing proxy submission'
} | ConvertTo-Json

try {
    $quoteRes = Invoke-RestMethod -Uri 'http://localhost:5173/api/v1/public/leads' -Method Post -Body $quoteJson -ContentType 'application/json'
    Write-Host " [+] Frontend Proxy Quote SUCCESS! Lead Code: $($quoteRes.data.leadCode)"
} catch {
    Write-Host " [-] Frontend Proxy Quote FAILED! Error: $_"
}
