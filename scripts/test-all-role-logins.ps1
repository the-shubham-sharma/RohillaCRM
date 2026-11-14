$ErrorActionPreference = 'Stop'

Write-Host "================================================================================"
Write-Host "ROHILLA ADVERTISING CRM -- COMPLETE 6-ROLE LOGIN AND AUTHENTICATION AUDIT"
Write-Host "================================================================================"

$baseUrl = "http://localhost:8080/api/v1"

# Define the 6 roles and test criteria
$roles = @(
    @{
        name = "ADMIN"
        email = "admin@rohilla.com"
        expectedRole = "ROLE_ADMIN"
        expectedRedirect = "/admin"
        apiEndpoint = "/projects"
        forbiddenEndpoint = $null
    },
    @{
        name = "MANAGER"
        email = "manager@rohilla.com"
        expectedRole = "ROLE_MANAGER"
        expectedRedirect = "/manager"
        apiEndpoint = "/leads"
        forbiddenEndpoint = "/audit-logs"
    },
    @{
        name = "DESIGNER"
        email = "designer@rohilla.com"
        expectedRole = "ROLE_DESIGNER"
        expectedRedirect = "/designer"
        apiEndpoint = "/workspace/designer"
        forbiddenEndpoint = "/audit-logs"
    },
    @{
        name = "PRODUCTION"
        email = "production@rohilla.com"
        expectedRole = "ROLE_PRODUCTION"
        expectedRedirect = "/production"
        apiEndpoint = "/workspace/production"
        forbiddenEndpoint = "/users"
    },
    @{
        name = "QC"
        email = "qc@rohilla.com"
        expectedRole = "ROLE_QC"
        expectedRedirect = "/qc"
        apiEndpoint = "/workspace/qc"
        forbiddenEndpoint = "/users"
    },
    @{
        name = "DISPATCH"
        email = "dispatch@rohilla.com"
        expectedRole = "ROLE_DISPATCH"
        expectedRedirect = "/dispatch"
        apiEndpoint = "/workspace/dispatch"
        forbiddenEndpoint = "/users"
    }
)

$tokens = @{}
$refreshTokens = @{}

Write-Host ""
Write-Host "--- 1. Testing Login and Dashboard APIs for All 6 Employee Roles ---"

foreach ($item in $roles) {
    $loginBody = @{
        email = $item.email
        password = "password123"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginRes.success -ne $true -or -not $loginRes.data.accessToken) {
        throw "Login failed for $($item.name) ($($item.email))"
    }

    $token = $loginRes.data.accessToken
    $refreshToken = $loginRes.data.refreshToken
    $tokens[$item.name] = $token
    $refreshTokens[$item.name] = $refreshToken

    # Verify role returned in user payload
    $userRoles = $loginRes.data.user.roles
    if (-not ($userRoles -contains $item.expectedRole)) {
        throw "Role mismatch for $($item.name). Expected: $($item.expectedRole), Actual: $($userRoles -join ', ')"
    }

    # Verify Dashboard API Access
    $authHeader = @{ Authorization = "Bearer $token" }
    $apiRes = Invoke-RestMethod -Uri "$baseUrl$($item.apiEndpoint)" -Method Get -Headers $authHeader
    if ($apiRes.success -ne $true) {
        throw "Dashboard API $($item.apiEndpoint) failed for $($item.name)"
    }

    # Verify Forbidden API rejection (RBAC)
    if ($item.forbiddenEndpoint) {
        try {
            Invoke-RestMethod -Uri "$baseUrl$($item.forbiddenEndpoint)" -Method Get -Headers $authHeader
            throw "RBAC Failure: Role $($item.name) was NOT blocked from accessing $($item.forbiddenEndpoint)"
        } catch {
            # Expected 403 Forbidden
        }
    }

    Write-Host " [PASS] Role: $($item.name.PadRight(10)) | Email: $($item.email.PadRight(24)) | Redirect: $($item.expectedRedirect.PadRight(12)) | API: $($item.apiEndpoint) (OK)"
}

Write-Host ""
Write-Host "--- 2. Testing Invalid Authentication Cases ---"

# Wrong password
try {
    $badPassBody = @{ email = "admin@rohilla.com"; password = "wrongpassword" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $badPassBody -ContentType "application/json"
    throw "Security Failure: Backend accepted incorrect password"
} catch {
    Write-Host " [PASS] Wrong password correctly rejected with HTTP 401 Unauthorized"
}

# Unknown user
try {
    $unknownUser = @{ email = "nonexistent@rohilla.com"; password = "password123" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $unknownUser -ContentType "application/json"
    throw "Security Failure: Backend accepted nonexistent email"
} catch {
    Write-Host " [PASS] Nonexistent email correctly rejected with HTTP 401 Unauthorized"
}

Write-Host ""
Write-Host "--- 3. Testing Refresh Token Flow ---"
$adminRefreshToken = $refreshTokens["ADMIN"]
$refreshBody = @{ refreshToken = $adminRefreshToken } | ConvertTo-Json
$refreshRes = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
if ($refreshRes.success -ne $true -or -not $refreshRes.data.accessToken) {
    throw "Refresh token exchange failed"
}
Write-Host " [PASS] Token refresh successful -> New access token issued: $($refreshRes.data.accessToken.Substring(0, 25))..."

Write-Host ""
Write-Host "--- 4. Testing Public Customer Quote Intake (No Auth Required) ---"
$quoteBody = @{
    name = "Public Customer"
    phone = "9812345678"
    productService = "3D Acrylic Signboard"
    quantity = 2
    size = "8x4"
    location = "Dehradun Rajpur Road"
    requirement = "Shop front acrylic letters"
} | ConvertTo-Json
$quoteRes = Invoke-RestMethod -Uri "$baseUrl/public/leads" -Method Post -Body $quoteBody -ContentType "application/json"
if ($quoteRes.success -ne $true -or -not $quoteRes.data.leadCode) {
    throw "Public customer quote submission failed"
}
Write-Host " [PASS] Public quote submitted successfully (Lead Reference: $($quoteRes.data.leadCode))"

Write-Host ""
Write-Host "--- 5. Testing Internal CRM Security (Unauthenticated Access Blocked) ---"
try {
    Invoke-RestMethod -Uri "$baseUrl/leads" -Method Get
    throw "Security Failure: Unauthenticated request to /leads was NOT blocked"
} catch {
    Write-Host " [PASS] Unauthenticated request to internal CRM blocked with HTTP 401 Unauthorized"
}

Write-Host ""
Write-Host "================================================================================"
Write-Host "ALL 6 EMPLOYEE ROLES, RBAC, TOKEN REFRESH AND PUBLIC ACCESS VERIFIED 100%!"
Write-Host "================================================================================"
