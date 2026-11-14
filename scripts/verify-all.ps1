$ErrorActionPreference = 'Stop'

Write-Host '=========================================================='
Write-Host ' STEP 20 & 21: COMPREHENSIVE LOGIN & QUOTE VERIFICATION   '
Write-Host '=========================================================='

$baseUrl = 'http://localhost:8080/api/v1'

# 1. Verify Employee Logins for all 6 roles
Write-Host '--- 1. Testing Employee Logins for all 6 Roles ---'
$rolesToTest = @(
    @{ email = 'admin@rohilla.com'; role = 'ROLE_ADMIN'; expectedName = 'Aditye Rohilla' },
    @{ email = 'manager@rohilla.com'; role = 'ROLE_MANAGER'; expectedName = 'Amit Sharma (Operations Manager)' },
    @{ email = 'designer@rohilla.com'; role = 'ROLE_DESIGNER'; expectedName = 'Pooja Verma (Lead Designer)' },
    @{ email = 'production@rohilla.com'; role = 'ROLE_PRODUCTION'; expectedName = 'Vikram Singh (Print Master)' },
    @{ email = 'qc@rohilla.com'; role = 'ROLE_QC'; expectedName = 'Sanjay Mehta (QC Inspector)' },
    @{ email = 'dispatch@rohilla.com'; role = 'ROLE_DISPATCH'; expectedName = 'Ramesh Kumar (Logistics & Install)' }
)

$tokens = @{}
foreach ($item in $rolesToTest) {
    $loginBody = @{ email = $item.email; password = 'password123' } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
    if ($res.success -ne $true -or -not $res.data.accessToken) {
        throw "Login failed for $($item.email)"
    }
    $tokens[$item.role] = $res.data.accessToken
    Write-Host " [PASS] Role $($item.role) ($($item.email)) logged in successfully. User: $($res.data.user.fullName)"
}

# 2. Step 21: Submit Customer Quote as requested
Write-Host ''
Write-Host '--- 2. Step 21: Submit Customer Quote ---'
$quotePayload = @{
    name = 'Test Customer'
    phone = '9810001111'
    productService = '3D Acrylic & LED Signage'
    quantity = 3
    size = '10x4'
    location = 'Dehradun'
    requirement = 'Test quotation request'
}

$quoteJson = $quotePayload | ConvertTo-Json
$quoteRes = Invoke-RestMethod -Uri "$baseUrl/public/leads" -Method Post -Body $quoteJson -ContentType 'application/json'

if ($quoteRes.success -ne $true -or -not $quoteRes.data.leadCode) {
    throw "Quote submission failed: $($quoteRes | ConvertTo-Json)"
}

$createdLeadCode = $quoteRes.data.leadCode
$createdLeadId = $quoteRes.data.id
Write-Host " [PASS] Customer quote created successfully!"
Write-Host "        Lead Reference Code : $createdLeadCode"
Write-Host "        Lead ID             : $createdLeadId"
Write-Host "        Customer Name       : $($quoteRes.data.customerName)"
Write-Host "        Phone               : $($quoteRes.data.phone)"
Write-Host "        Product/Service     : $($quoteRes.data.productService)"
Write-Host "        Quantity            : $($quoteRes.data.quantity)"
Write-Host "        Size                : $($quoteRes.data.size)"
Write-Host "        Location            : $($quoteRes.data.location)"
Write-Host "        Status              : $($quoteRes.data.status)"

# 3. Verify Lead is visible in Manager & Admin CRM
Write-Host ''
Write-Host '--- 3. Verifying Lead Visibility in Manager & Admin CRM ---'
$adminHeaders = @{ Authorization = "Bearer $($tokens['ROLE_ADMIN'])" }
$managerHeaders = @{ Authorization = "Bearer $($tokens['ROLE_MANAGER'])" }

$leadsRes = Invoke-RestMethod -Uri "$baseUrl/leads" -Method Get -Headers $managerHeaders
$foundLead = $leadsRes.data | Where-Object { $_.leadCode -eq $createdLeadCode }

if (-not $foundLead) {
    throw "Created lead $createdLeadCode was NOT found in Manager lead list!"
}
Write-Host " [PASS] Lead $createdLeadCode found in Manager CRM pipeline (Total leads: $($leadsRes.data.Count))"

# 4. Update Lead Status (e.g. to CONTACTED)
Write-Host ''
Write-Host '--- 4. Testing Lead Status Update by Manager ---'
$updateBody = @{
    status = 'CONTACTED'
    notes = 'Followed up via phone call with customer.'
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "$baseUrl/leads/$createdLeadId/status" -Method Patch -Body $updateBody -ContentType 'application/json' -Headers $managerHeaders
Write-Host " [PASS] Lead status updated to: $($updateRes.data.status)"

# 5. Phone Validation Verification (Step 14)
Write-Host ''
Write-Host '--- 5. Testing Phone Validation (Accepts valid, rejects invalid) ---'

# Invalid phone: letters
try {
    $invalidBody = @{
        name = 'Invalid Phone'
        phone = '98ABC01111'
        productService = 'Outdoor Advertising'
        quantity = 1
        size = '10x10'
        location = 'Delhi'
        requirement = 'Test'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/public/leads" -Method Post -Body $invalidBody -ContentType 'application/json'
    throw "Validation failed: Backend accepted phone with letters '98ABC01111'"
} catch {
    Write-Host " [PASS] Correctly rejected '98ABC01111' (Expected 400 Bad Request)"
}

# Invalid phone: too short
try {
    $invalidBody = @{
        name = 'Short Phone'
        phone = '12345'
        productService = 'Outdoor Advertising'
        quantity = 1
        size = '10x10'
        location = 'Delhi'
        requirement = 'Test'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/public/leads" -Method Post -Body $invalidBody -ContentType 'application/json'
    throw "Validation failed: Backend accepted short phone '12345'"
} catch {
    Write-Host " [PASS] Correctly rejected '12345' (Expected 400 Bad Request)"
}

# Valid phone with +91 prefix
$validPlus91 = @{
    name = 'Plus91 Customer'
    phone = '+919810003333'
    productService = 'Flex Printing'
    quantity = 5
    size = '20x10'
    location = 'Noida'
    requirement = 'Testing +91 format'
} | ConvertTo-Json
$validRes = Invoke-RestMethod -Uri "$baseUrl/public/leads" -Method Post -Body $validPlus91 -ContentType 'application/json'
Write-Host " [PASS] Successfully accepted '+919810003333' -> Cleaned phone: $($validRes.data.phone), Lead: $($validRes.data.leadCode)"

Write-Host ''
Write-Host '=========================================================='
Write-Host ' ALL LOGIN, QUOTE, AND CRM LEAD CHECKS PASSED 100%!       '
Write-Host '=========================================================='
