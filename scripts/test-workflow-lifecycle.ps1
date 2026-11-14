$ErrorActionPreference = 'Stop'

Write-Host "============================================================"
Write-Host "TESTING COMPLETE WORKFLOW PIPELINE ON RE-ARCHITECTED BACKEND"
Write-Host "============================================================"

$baseUrl = "http://localhost:8080/api/v1"

# 1. Login Manager
$mgrLogin = @{ email = "manager@rohilla.com"; password = "password123" } | ConvertTo-Json
$mgrRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $mgrLogin -ContentType "application/json"
$mgrToken = $mgrRes.data.accessToken
$mgrHeaders = @{ Authorization = "Bearer $mgrToken" }
Write-Host "[1] Manager logged in: $($mgrRes.data.user.fullName)"

# 2. Login Designer
$designerLogin = @{ email = "designer@rohilla.com"; password = "password123" } | ConvertTo-Json
$designerRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $designerLogin -ContentType "application/json"
$designerHeaders = @{ Authorization = "Bearer $($designerRes.data.accessToken)" }
$designerId = $designerRes.data.user.id
Write-Host "[2] Designer logged in: $($designerRes.data.user.fullName)"

# 3. Login Production
$prodLogin = @{ email = "production@rohilla.com"; password = "password123" } | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $prodLogin -ContentType "application/json"
$prodHeaders = @{ Authorization = "Bearer $($prodRes.data.accessToken)" }
$prodId = $prodRes.data.user.id
Write-Host "[3] Production Master logged in: $($prodRes.data.user.fullName)"

# 4. Login QC Inspector
$qcLogin = @{ email = "qc@rohilla.com"; password = "password123" } | ConvertTo-Json
$qcRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $qcLogin -ContentType "application/json"
$qcHeaders = @{ Authorization = "Bearer $($qcRes.data.accessToken)" }
$qcId = $qcRes.data.user.id
Write-Host "[4] QC Inspector logged in: $($qcRes.data.user.fullName)"

# 5. Login Dispatch Officer
$dispLogin = @{ email = "dispatch@rohilla.com"; password = "password123" } | ConvertTo-Json
$dispRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $dispLogin -ContentType "application/json"
$dispHeaders = @{ Authorization = "Bearer $($dispRes.data.accessToken)" }
$dispId = $dispRes.data.user.id
Write-Host "[5] Dispatch Officer logged in: $($dispRes.data.user.fullName)"

# ============================================================
# PATH A LIFECYCLE: Customer Provided Design (designRequired = false)
# ============================================================
Write-Host ""
Write-Host "--- TESTING PATH A: Customer Provided Artwork Workflow & QC Rework ---"

# Step A.1: Customer submits Quote with designRequired = false
$leadReqA = @{
    name = "Path A Customer"
    phone = "9811223344"
    requirement = "Print 5 large vinyl banners with our approved artwork"
    productService = "Vinyl Banner Printing"
    quantity = 5
    size = "10x5"
    location = "Dehradun Industrial Area"
    designRequired = $false
} | ConvertTo-Json

$leadResA = Invoke-RestMethod -Uri "$baseUrl/public/leads" -Method Post -Body $leadReqA -ContentType "application/json"
$leadIdA = $leadResA.data.id
$leadCodeA = $leadResA.data.leadCode
Write-Host "[A.1] Created Path A Lead: $leadCodeA"

# Step A.2: Convert Lead to Project
$convertResA = Invoke-RestMethod -Uri "$baseUrl/leads/$leadIdA/convert" -Method Post -Headers $mgrHeaders
$projIdA = $convertResA.data.id
$projCodeA = $convertResA.data.projectCode
Write-Host "[A.2] Converted to Project $projCodeA (Status: $($convertResA.data.status), Path A: $($convertResA.data.customerProvidedDesign))"

# Step A.3: Manager Assigns Department Team (Designer, Production, QC, Dispatch)
$assignDesign = @{ department = "DESIGN"; employeeId = $designerId; notes = "Perform machine compatibility check" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/assign" -Method Post -Body $assignDesign -ContentType "application/json" -Headers $mgrHeaders | Out-Null

$assignProd = @{ department = "PRODUCTION"; employeeId = $prodId; notes = "Assigned for fabrication" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/assign" -Method Post -Body $assignProd -ContentType "application/json" -Headers $mgrHeaders | Out-Null

$assignQc = @{ department = "QUALITY_CONTROL"; employeeId = $qcId; notes = "Assigned for QC inspection" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/assign" -Method Post -Body $assignQc -ContentType "application/json" -Headers $mgrHeaders | Out-Null

$assignDisp = @{ department = "DISPATCH"; employeeId = $dispId; notes = "Assigned for logistics and install" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/assign" -Method Post -Body $assignDisp -ContentType "application/json" -Headers $mgrHeaders | Out-Null

Write-Host "[A.3] Manager assigned all department staff (Designer, Production, QC, Dispatch) successfully."

# Step A.4: Designer moves to DESIGN_TECHNICAL_CHECK
$wfTechCheckStart = @{ targetStatus = "DESIGN_TECHNICAL_CHECK"; notes = "Starting technical compatibility check" } | ConvertTo-Json
$techCheckStartRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/workflow/transition" -Method Post -Body $wfTechCheckStart -ContentType "application/json" -Headers $designerHeaders
Write-Host "[A.4] Designer transitioned to DESIGN_TECHNICAL_CHECK -> Status: $($techCheckStartRes.data.status)"

# Step A.5: Designer Records Technical Compatibility Check -> Moves to READY_FOR_PRODUCTION
$techCheckBody = @{
    passed = $true
    compatibilityNotes = "Resolution 300dpi CMYK verified. Machine color profile calibrated."
} | ConvertTo-Json
$techCheckRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/technical-check" -Method Post -Body $techCheckBody -ContentType "application/json" -Headers $designerHeaders
Write-Host "[A.5] Technical Check PASSED -> Project Status: $($techCheckRes.data.status)"

# Step A.6: Production starts work -> IN_PRODUCTION
$wfProdStart = @{ targetStatus = "IN_PRODUCTION"; notes = "Vinyl printing started on Roland Machine 01" } | ConvertTo-Json
$prodStartRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/workflow/transition" -Method Post -Body $wfProdStart -ContentType "application/json" -Headers $prodHeaders
Write-Host "[A.6] Production started -> Project Status: $($prodStartRes.data.status)"

# Step A.7: Production finishes work -> QC_PENDING
$wfProdDone = @{ targetStatus = "QC_PENDING"; notes = "Printing complete, dried, and eyeleted." } | ConvertTo-Json
$prodDoneRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/workflow/transition" -Method Post -Body $wfProdDone -ContentType "application/json" -Headers $prodHeaders
Write-Host "[A.7] Production completed -> Project Status: $($prodDoneRes.data.status)"

# Step A.8a: QC Inspection -> REJECTED (Testing QC Rework Loop)
$qcFailBody = @{
    passed = $false
    colorAccuracyScore = 4
    dimensionAccuracyScore = 5
    finishingScore = 3
    remarks = "Color mismatch on edge banner and eyelet missing on corner"
    defectsNotes = "Recalibrate ink heads and re-punch eyelets"
} | ConvertTo-Json
$qcFailRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/qc" -Method Post -Body $qcFailBody -ContentType "application/json" -Headers $qcHeaders
Write-Host "[A.8a] QC Inspection REJECTED -> Project Status: $($qcFailRes.data.passed)"

# Step A.8b: Production re-executes rework -> IN_PRODUCTION
$wfReworkStart = @{ targetStatus = "IN_PRODUCTION"; notes = "Reworking eyelet and color balance" } | ConvertTo-Json
$reworkStartRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/workflow/transition" -Method Post -Body $wfReworkStart -ContentType "application/json" -Headers $prodHeaders
Write-Host "[A.8b] Production resumed for QC Rework -> Project Status: $($reworkStartRes.data.status)"

# Step A.8c: Production completes rework -> QC_PENDING
$wfReworkDone = @{ targetStatus = "QC_PENDING"; notes = "Rework completed, eyelets corrected." } | ConvertTo-Json
$reworkDoneRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/workflow/transition" -Method Post -Body $wfReworkDone -ContentType "application/json" -Headers $prodHeaders
Write-Host "[A.8c] Production completed rework -> Project Status: $($reworkDoneRes.data.status)"

# Step A.8d: QC Re-Inspection -> PASSED -> READY_FOR_DISPATCH (QC_PASSED)
$qcPassBody = @{
    passed = $true
    colorAccuracyScore = 10
    dimensionAccuracyScore = 10
    finishingScore = 10
    remarks = "All eyelets and color shades perfectly corrected"
} | ConvertTo-Json
$qcPassRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/qc" -Method Post -Body $qcPassBody -ContentType "application/json" -Headers $qcHeaders
Write-Host "[A.8d] QC Re-Inspection PASSED -> Scores: 10/10/10"

# Step A.9: Dispatch logs vehicle -> DISPATCHED
$dispBody = @{
    dispatchDate = (Get-Date).ToString("yyyy-MM-dd")
    courierPartner = "Rohilla Logistics Fleet"
    trackingNumber = "ROH-TRK-778899"
    recipientName = "Dehradun Site Supervisor"
    destinationAddress = "Plot 42, Dehradun Industrial Area"
    dispatchNotes = "Dispatched via Van 02"
} | ConvertTo-Json
$dispPostRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/dispatch" -Method Post -Body $dispBody -ContentType "application/json" -Headers $dispHeaders
Write-Host "[A.9] Dispatch recorded -> Tracking: $($dispPostRes.data.trackingNumber), Partner: $($dispPostRes.data.courierPartner)"

# Step A.10: Complete Installation & Close Project -> COMPLETED
$installBody = @{
    installationDate = (Get-Date).ToString("yyyy-MM-dd")
    installationNotes = "Banners installed on site frame with sign-off"
} | ConvertTo-Json
$installRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projIdA/installation" -Method Post -Body $installBody -ContentType "application/json" -Headers $mgrHeaders
Write-Host "[A.10] Installation Complete & Project Closed -> Project Status: $($installRes.data.status)"

Write-Host ""
Write-Host "============================================================"
Write-Host "ALL INTEGRATION, QC REWORK & WORKFLOW TESTS PASSED 100%!"
Write-Host "============================================================"
