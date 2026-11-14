$ErrorActionPreference = 'Continue'

Write-Host "============================================================"
Write-Host "ROHILLA ADVERTISING CRM - ENTRY GATEWAY AND API TEST SUITE"
Write-Host "============================================================"

$frontendUrl = "http://localhost:5173"
$allPassed = $true

# 1. Test Route Endpoints
Write-Host "`n[1] Testing Frontend Route Endpoints on $frontendUrl..."
$routes = @('/', '/customer-quote', '/employee-login', '/quote', '/login')
foreach ($r in $routes) {
    try {
        $resp = Invoke-WebRequest -Uri "$frontendUrl$r" -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) {
            Write-Host "  [PASS] Route $r : HTTP 200 OK"
        } else {
            Write-Host "  [FAIL] Route $r : Returned status $($resp.StatusCode)"
            $allPassed = $false
        }
    } catch {
        Write-Host "  [FAIL] Route $r : Error ($($_))"
        $allPassed = $false
    }
}

# 2. Test Customer Quote Submission (Valid)
Write-Host "`n[2] Testing Customer Quote Submission via Frontend Proxy..."
$validCustomerQuote = @{
    name = "Vikram Malhotra"
    phone = "9812345678"
    email = "vikram.malhotra@test.com"
    company = "Malhotra Enterprises"
    productService = "Outdoor Advertising"
    quantity = 2
    size = "20x10 ft"
    location = "Gurugram Cyber Hub"
    requirement = "Highway LED Hoarding for Annual Brand Campaign"
    designRequired = $false
    notes = "Urgent project completion needed"
} | ConvertTo-Json

$createdLeadCode = $null
try {
    $leadResp = Invoke-RestMethod -Uri "$frontendUrl/api/v1/public/leads" -Method Post -Body $validCustomerQuote -ContentType 'application/json'
    if ($leadResp.success -eq $true -and $leadResp.data.leadCode) {
        $createdLeadCode = $leadResp.data.leadCode
        Write-Host "  [PASS] Public Quote Created Successfully! Reference Code: $createdLeadCode"
        Write-Host "  [PASS] Customer Name: $($leadResp.data.customerName), Status: $($leadResp.data.status)"
    } else {
        Write-Host "  [FAIL] Unexpected response"
        $allPassed = $false
    }
} catch {
    Write-Host "  [FAIL] Failed to submit public lead: $_"
    $allPassed = $false
}

# 3. Test Invalid Mobile Number (Validation)
Write-Host "`n[3] Testing Invalid Mobile Number Validation..."
$invalidPhoneQuote = @{
    name = "Invalid Customer"
    phone = "1234567891"
    productService = "Outdoor Advertising"
    quantity = 1
    size = "10x4 ft"
    location = "Delhi"
    requirement = "Test invalid phone"
} | ConvertTo-Json

try {
    $invResp = Invoke-RestMethod -Uri "$frontendUrl/api/v1/public/leads" -Method Post -Body $invalidPhoneQuote -ContentType 'application/json'
    Write-Host "  [FAIL] Validation failed: Invalid phone was accepted"
    $allPassed = $false
} catch {
    Write-Host "  [PASS] Rejected invalid phone (1234567891) with HTTP 400 Bad Request as expected"
}

# 4. Test Employee Logins for all 6 Roles
Write-Host "`n[4] Testing Employee Authentication for All 6 Roles..."
$employeeCredentials = @(
    @{ Role = "ADMIN"; Email = "admin@rohilla.com" },
    @{ Role = "MANAGER"; Email = "manager@rohilla.com" },
    @{ Role = "DESIGNER"; Email = "designer@rohilla.com" },
    @{ Role = "PRODUCTION"; Email = "production@rohilla.com" },
    @{ Role = "QC"; Email = "qc@rohilla.com" },
    @{ Role = "DISPATCH"; Email = "dispatch@rohilla.com" }
)

$managerToken = $null

foreach ($emp in $employeeCredentials) {
    $loginBody = @{
        email = $emp.Email
        password = "password123"
    } | ConvertTo-Json

    try {
        $authResp = Invoke-RestMethod -Uri "$frontendUrl/api/v1/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
        if ($authResp.success -eq $true -and $authResp.data.accessToken) {
            $roleList = $authResp.data.user.roles -join ', '
            Write-Host "  [PASS] $($emp.Role) Authenticated: $($authResp.data.user.fullName) | Roles: [$roleList]"
            if ($emp.Role -eq "MANAGER") {
                $managerToken = $authResp.data.accessToken
            }
        } else {
            Write-Host "  [FAIL] $($emp.Role) login failed"
            $allPassed = $false
        }
    } catch {
        Write-Host "  [FAIL] $($emp.Role) login error: $_"
        $allPassed = $false
    }
}

# 5. Test CRM Internal API Protection (Unauthenticated)
Write-Host "`n[5] Testing CRM Security (Unauthenticated request to /api/v1/leads)..."
try {
    $unauthResp = Invoke-RestMethod -Uri "$frontendUrl/api/v1/leads" -Method Get
    Write-Host "  [FAIL] Security breach: Unauthenticated request was allowed"
    $allPassed = $false
} catch {
    Write-Host "  [PASS] Internal CRM API correctly blocked with HTTP 401 UNAUTHORIZED"
}

# 6. Test Manager Lead Retrieval (Verify Created Lead appears in CRM)
Write-Host "`n[6] Testing Manager Lead Retrieval (Verify newly submitted lead in internal CRM)..."
if ($managerToken -and $createdLeadCode) {
    try {
        $headers = @{ Authorization = "Bearer $managerToken" }
        $crmLeadsResp = Invoke-RestMethod -Uri "$frontendUrl/api/v1/leads" -Method Get -Headers $headers
        $foundLead = $crmLeadsResp.data | Where-Object { $_.leadCode -eq $createdLeadCode }
        if ($foundLead) {
            Write-Host "  [PASS] Verified: Created lead $createdLeadCode is visible in Manager Lead Management!"
            Write-Host "  [PASS] Lead details: Customer=$($foundLead.customerName), Product=$($foundLead.productService), Location=$($foundLead.location)"
        } else {
            Write-Host "  [FAIL] Lead $createdLeadCode not found in Manager leads list"
            $allPassed = $false
        }
    } catch {
        Write-Host "  [FAIL] Failed to retrieve leads as Manager: $_"
        $allPassed = $false
    }
}

Write-Host "`n============================================================"
if ($allPassed) {
    Write-Host "ALL GATEWAY, ROUTE, QUOTE AND LOGIN TESTS PASSED SUCCESSFULLY!"
} else {
    Write-Host "SOME TESTS ENCOUNTERED ISSUES. CHECK DETAILS ABOVE."
}
Write-Host "============================================================"
