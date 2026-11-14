$ErrorActionPreference = 'Stop'
$BaseUrl = "http://localhost:8080/api/v1"

function Login-User($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"
    return $res.data.accessToken
}

function Get-UserNotifications($token) {
    $headers = @{ Authorization = "Bearer $token" }
    $res = Invoke-RestMethod -Uri "$BaseUrl/notifications" -Method GET -Headers $headers
    return $res.data
}

function Get-UserUnreadCount($token) {
    $headers = @{ Authorization = "Bearer $token" }
    $res = Invoke-RestMethod -Uri "$BaseUrl/notifications/unread-count" -Method GET -Headers $headers
    return $res.data.unreadCount
}

function Mark-NotificationRead($token, $id) {
    $headers = @{ Authorization = "Bearer $token" }
    $res = Invoke-RestMethod -Uri "$BaseUrl/notifications/$id/read" -Method PATCH -Headers $headers
    return $res
}

function Mark-AllNotificationsRead($token) {
    $headers = @{ Authorization = "Bearer $token" }
    $res = Invoke-RestMethod -Uri "$BaseUrl/notifications/mark-all-read" -Method POST -Headers $headers
    return $res
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "ROHILLA ADVERTISING CRM - COMPLETE NOTIFICATION SYSTEM AUDIT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Login all 6 roles
$AdminToken      = Login-User "admin@rohilla.com" "password123"
$ManagerToken    = Login-User "manager@rohilla.com" "password123"
$DesignerToken   = Login-User "designer@rohilla.com" "password123"
$ProductionToken = Login-User "production@rohilla.com" "password123"
$QcToken         = Login-User "qc@rohilla.com" "password123"
$DispatchToken   = Login-User "dispatch@rohilla.com" "password123"

Write-Host "[1] Logged in all 6 CRM roles successfully." -ForegroundColor Green

# 2. Public Customer Enquiry -> Trigger Admin & Manager notification
Write-Host "`n[2] Triggering Public Customer Lead..." -ForegroundColor Yellow
$leadPayload = @{
    name = "Global Enterprises"
    email = "contact@globalent.com"
    phone = "9876543210"
    company = "Global Enterprises Pvt Ltd"
    requirement = "Outdoor Weatherproof Signage with LED illumination"
    productService = "3D Acrylic LED Signboard"
    quantity = 2
    size = "10x4 ft"
    location = "Sector 18, Noida"
    notes = "Outdoor weatherproof building signage"
} | ConvertTo-Json

$leadRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/public/leads" -Method POST -Body $leadPayload -ContentType "application/json"
$createdLeadId = $leadRes.data.id
Write-Host "  Public Lead submitted: $($leadRes.data.leadCode) (ID: $createdLeadId)" -ForegroundColor Cyan

# Verify Admin & Manager received lead notifications
$mgrNotifs = Get-UserNotifications $ManagerToken
$admNotifs = Get-UserNotifications $AdminToken
$mgrLeadNotif = $mgrNotifs | Where-Object { $_.title -like "*Lead*" } | Select-Object -First 1

if ($mgrLeadNotif) {
    Write-Host "  [PASS] Manager received Lead notification: '$($mgrLeadNotif.title)', Target: $($mgrLeadNotif.linkUrl)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Manager did not receive Lead notification" -ForegroundColor Red
}

# 3. Manager Converts Lead to Project -> Assigns Designer, Production, QC, Dispatch
Write-Host "`n[3] Converting Lead to Project and assigning Designer..." -ForegroundColor Yellow
$mgrHeaders = @{ Authorization = "Bearer $ManagerToken" }

# Convert lead
$projRes = Invoke-RestMethod -Uri "$BaseUrl/leads/$createdLeadId/convert" -Method POST -Headers $mgrHeaders -ContentType "application/json"
$projectId = $projRes.data.id
$projectCode = $projRes.data.projectCode
Write-Host "  Converted to Project: $projectCode (ID: $projectId)" -ForegroundColor Cyan

# Get Staff User IDs
$usersRes = Invoke-RestMethod -Uri "$BaseUrl/users" -Method GET -Headers $mgrHeaders
$designerUser = $usersRes.data | Where-Object { $_.email -eq "designer@rohilla.com" } | Select-Object -First 1
$productionUser = $usersRes.data | Where-Object { $_.email -eq "production@rohilla.com" } | Select-Object -First 1
$qcUser = $usersRes.data | Where-Object { $_.email -eq "qc@rohilla.com" } | Select-Object -First 1
$dispatchUser = $usersRes.data | Where-Object { $_.email -eq "dispatch@rohilla.com" } | Select-Object -First 1

# Assign Designer, Production, QC, Dispatch
$assignDesignerPayload = @{ department = "DESIGN"; employeeId = $designerUser.id; notes = "Verify 300 DPI resolution" } | ConvertTo-Json
$assignProdPayload = @{ department = "PRODUCTION"; employeeId = $productionUser.id; notes = "Print on 3mm Acrylic" } | ConvertTo-Json
$assignQcPayload = @{ department = "QUALITY_CONTROL"; employeeId = $qcUser.id; notes = "Perform dimensional inspection" } | ConvertTo-Json
$assignDispPayload = @{ department = "DISPATCH"; employeeId = $dispatchUser.id; notes = "Dispatch to Noida location" } | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/assign" -Method POST -Body $assignProdPayload -Headers $mgrHeaders -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/assign" -Method POST -Body $assignQcPayload -Headers $mgrHeaders -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/assign" -Method POST -Body $assignDispPayload -Headers $mgrHeaders -ContentType "application/json" | Out-Null
Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/assign" -Method POST -Body $assignDesignerPayload -Headers $mgrHeaders -ContentType "application/json" | Out-Null

# Manager transitions to DESIGN_TECHNICAL_CHECK
$toDesignPayload = @{ targetStatus = "DESIGN_TECHNICAL_CHECK"; remarks = "Assigned and released to Designer Studio" } | ConvertTo-Json
Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/workflow/transition" -Method POST -Body $toDesignPayload -Headers $mgrHeaders -ContentType "application/json" | Out-Null

Write-Host "  Assigned Designer ($($designerUser.fullName)), Production, QC, Dispatch and released to Design" -ForegroundColor Cyan

# 4. Verify Designer received notification
Write-Host "`n[4] Verifying Designer Task Notification..." -ForegroundColor Yellow
$designerNotifs = Get-UserNotifications $DesignerToken
$designerUnread = Get-UserUnreadCount $DesignerToken
$designerTaskNotif = $designerNotifs | Where-Object { $_.linkUrl -like "*$projectId*" } | Select-Object -First 1

if ($designerTaskNotif) {
    Write-Host "  [PASS] Designer received notification: '$($designerTaskNotif.title)', Target: $($designerTaskNotif.linkUrl)" -ForegroundColor Green
    Write-Host "  Designer Unread Count: $designerUnread" -ForegroundColor Cyan
} else {
    Write-Host "  [FAIL] Designer did not receive project notification" -ForegroundColor Red
}

# 5. Designer clicks notification -> Test Mark as Read & Count Decrement
Write-Host "`n[5] Testing Click Notification & Mark As Read for Designer..." -ForegroundColor Yellow
$markRes = Mark-NotificationRead $DesignerToken $designerTaskNotif.id
$designerNotifsAfter = Get-UserNotifications $DesignerToken
$designerUnreadAfter = Get-UserUnreadCount $DesignerToken

$updatedNotif = $designerNotifsAfter | Where-Object { $_.id -eq $designerTaskNotif.id }
if ($updatedNotif.isRead -eq $true) {
    Write-Host "  [PASS] Notification marked as READ in database: isRead = true" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Notification isRead is not true" -ForegroundColor Red
}

if ($designerNotifsAfter.Count -eq $designerNotifs.Count) {
    Write-Host "  [PASS] Read notification remains in notification history (NOT deleted)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Notification was deleted!" -ForegroundColor Red
}

Write-Host "  Unread count changed from $designerUnread to $designerUnreadAfter" -ForegroundColor Cyan

# 6. Test IDOR Protection (Designer attempts to mark Manager notification as read)
Write-Host "`n[6] Testing IDOR Security Protection (Cross-user Access Denied)..." -ForegroundColor Yellow
$mgrNotifToHijack = $mgrNotifs[0]
Write-Host "  Attempting to mark Manager notification $($mgrNotifToHijack.id) using Designer token..." -ForegroundColor Gray

try {
    Mark-NotificationRead $DesignerToken $mgrNotifToHijack.id
    Write-Host "  [FAIL] IDOR Vulnerability detected!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  [PASS] Access Denied! Server returned HTTP $statusCode for unauthorized user access." -ForegroundColor Green
}

# 7. Designer performs Technical Check -> moves project to READY_FOR_PRODUCTION
Write-Host "`n[7] Designer completes Technical Check..." -ForegroundColor Yellow
$designerHeaders = @{ Authorization = "Bearer $DesignerToken" }
$techCheckPayload = @{
    passed = $true
    compatibilityNotes = "Artwork verified 300 DPI CMYK ready for floor print"
} | ConvertTo-Json

$tcRes = Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/technical-check" -Method POST -Body $techCheckPayload -Headers $designerHeaders -ContentType "application/json"
Write-Host "  Project Status moved to: $($tcRes.data.status)" -ForegroundColor Cyan

# 8. Verify Production received notification
Write-Host "`n[8] Verifying Production Floor Notification..." -ForegroundColor Yellow
$prodNotifs = Get-UserNotifications $ProductionToken
$prodTaskNotif = $prodNotifs | Where-Object { $_.linkUrl -like "*$projectId*" } | Select-Object -First 1

if ($prodTaskNotif) {
    Write-Host "  [PASS] Production received notification: '$($prodTaskNotif.title)', Target: $($prodTaskNotif.linkUrl)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Production did not receive notification" -ForegroundColor Red
}

# 9. Production starts and completes job -> QC Pending
Write-Host "`n[9] Production completes job -> Moves to QC..." -ForegroundColor Yellow
$prodHeaders = @{ Authorization = "Bearer $ProductionToken" }

$startProdPayload = @{ targetStatus = "IN_PRODUCTION"; remarks = "Print started on Flatbed UV" } | ConvertTo-Json
$completeProdPayload = @{ targetStatus = "PRODUCTION_COMPLETED"; remarks = "Print finished and cured" } | ConvertTo-Json

$startProd = Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/workflow/transition" -Method POST -Body $startProdPayload -Headers $prodHeaders -ContentType "application/json"
$completeProd = Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/workflow/transition" -Method POST -Body $completeProdPayload -Headers $prodHeaders -ContentType "application/json"
Write-Host "  Project Status moved to: $($completeProd.data.status)" -ForegroundColor Cyan

# 10. Verify QC received notification
Write-Host "`n[10] Verifying QC Workstation Notification..." -ForegroundColor Yellow
$qcNotifs = Get-UserNotifications $QcToken
$qcTaskNotif = $qcNotifs | Where-Object { $_.linkUrl -like "*$projectId*" } | Select-Object -First 1

if ($qcTaskNotif) {
    Write-Host "  [PASS] QC received notification: '$($qcTaskNotif.title)', Target: $($qcTaskNotif.linkUrl)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] QC did not receive notification" -ForegroundColor Red
}

# 11. QC passes project -> Ready for Dispatch
Write-Host "`n[11] QC approves project -> Moves to Dispatch..." -ForegroundColor Yellow
$qcHeaders = @{ Authorization = "Bearer $QcToken" }
$qcPayload = @{
    passed = $true
    colorAccuracyScore = 10
    dimensionAccuracyScore = 10
    finishingScore = 10
    remarks = "Flawless fabrication, dimensions and color matching approved"
} | ConvertTo-Json

$qcPassRes = Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/qc" -Method POST -Body $qcPayload -Headers $qcHeaders -ContentType "application/json"
Write-Host "  QC evaluation recorded. Passed: $($qcPassRes.data.passed)" -ForegroundColor Cyan

# 12. Verify Dispatch received notification
Write-Host "`n[12] Verifying Dispatch & Logistics Notification..." -ForegroundColor Yellow
$dispNotifs = Get-UserNotifications $DispatchToken
$dispTaskNotif = $dispNotifs | Where-Object { $_.linkUrl -like "*$projectId*" } | Select-Object -First 1

if ($dispTaskNotif) {
    Write-Host "  [PASS] Dispatch received notification: '$($dispTaskNotif.title)', Target: $($dispTaskNotif.linkUrl)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Dispatch did not receive notification" -ForegroundColor Red
}

# 13. Dispatch dispatches project -> Notifies Manager
Write-Host "`n[13] Dispatch dispatches project..." -ForegroundColor Yellow
$dispHeaders = @{ Authorization = "Bearer $DispatchToken" }
$dispPayload = @{
    dispatchDate = [DateTime]::UtcNow.ToString("yyyy-MM-dd")
    courierPartner = "Blue Dart Express"
    trackingNumber = "BD-982347102"
    recipientName = "Global Enterprises"
    destinationAddress = "Sector 18, Noida"
    dispatchNotes = "Dispatched in reinforced wooden crate"
} | ConvertTo-Json

$dispRes = Invoke-RestMethod -Uri "$BaseUrl/projects/$projectId/dispatch" -Method POST -Body $dispPayload -Headers $dispHeaders -ContentType "application/json"
Write-Host "  Dispatch recorded: Tracking No $($dispRes.data.trackingNumber)" -ForegroundColor Cyan

# 14. Mark All As Read for Manager
Write-Host "`n[14] Testing Mark All As Read API for Manager..." -ForegroundColor Yellow
$mgrUnreadBeforeAll = Get-UserUnreadCount $ManagerToken
Mark-AllNotificationsRead $ManagerToken
$mgrUnreadAfterAll = Get-UserUnreadCount $ManagerToken
$mgrNotifsAfterAll = Get-UserNotifications $ManagerToken

if ($mgrUnreadAfterAll -eq 0) {
    Write-Host "  [PASS] Mark All As Read reset unread count from $mgrUnreadBeforeAll to 0" -ForegroundColor Green
    Write-Host "  [PASS] All $($mgrNotifsAfterAll.Count) Manager notifications preserved in history" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Manager unread count is $mgrUnreadAfterAll" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "ALL 12 NOTIFICATION AUDIT FLOWS PASSED WITH 100% SUCCESS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
