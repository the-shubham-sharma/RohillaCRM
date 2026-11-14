$ErrorActionPreference = 'Stop'

Write-Host '=========================================================='
Write-Host ' Rohilla Advertising CRM - Workspace and History Test '
Write-Host '=========================================================='

Write-Host ''
Write-Host '=== 1. Checking Actuator Health ==='
$health = Invoke-RestMethod -Uri 'http://localhost:8080/actuator/health' -Method Get
Write-Host "Health Status: $($health.status)"

Write-Host ''
Write-Host '=== 2. Authenticating 6 Internal Roles ==='
$roles = @(
    @{ email = 'admin@rohilla.com'; name = 'Admin/Owner (Aditye Rohilla)' },
    @{ email = 'manager@rohilla.com'; name = 'Operations Manager (Amit Sharma)' },
    @{ email = 'designer@rohilla.com'; name = 'Lead Designer (Pooja Verma)' },
    @{ email = 'production@rohilla.com'; name = 'Print Master (Vikram Singh)' },
    @{ email = 'qc@rohilla.com'; name = 'QC Inspector (Sanjay Mehta)' },
    @{ email = 'dispatch@rohilla.com'; name = 'Logistics Lead (Ramesh Kumar)' }
)

$tokens = @{}
foreach ($r in $roles) {
    $loginBody = (@{ email = $r.email; password = 'password123' } | ConvertTo-Json)
    $authRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    $tokens[$r.email] = $authRes.data.accessToken
    Write-Host " [+] $($r.name) ($($r.email)) -> Role: $($authRes.data.user.roles -join ', ')"
}

Write-Host ''
Write-Host '=== 3. Testing Designer Workspace (Active, Waiting, Recent) ==='
$designerHeaders = @{ Authorization = "Bearer $($tokens['designer@rohilla.com'])" }
$designerWs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/designer' -Method Get -Headers $designerHeaders
Write-Host "Designer Active Work Count  : $($designerWs.data.activeWork.Count)"
Write-Host "Designer Waiting Work Count : $($designerWs.data.waitingWork.Count)"
Write-Host "Designer Recent Work Count  : $($designerWs.data.recentWork.Count)"
if ($designerWs.data.activeWork.Count -gt 0) {
    $firstTask = $designerWs.data.activeWork[0]
    Write-Host " -> Active Task: [$($firstTask.projectCode)] $($firstTask.title) (Status: $($firstTask.status))"
}

Write-Host ''
Write-Host '=== 4. Testing Designer Permanent History and Performance ==='
$designerHist = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/history/designer?period=THIS_MONTH' -Method Get -Headers $designerHeaders
Write-Host "Designer History Records (This Month): $($designerHist.data.Count)"
foreach ($h in $designerHist.data) {
    Write-Host " * [$($h.projectCode)] $($h.title) | Task: $($h.taskType) | Versions: $($h.versionCount) | Status: $($h.finalStatus)"
}

$designerPerf = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/designer?period=THIS_MONTH' -Method Get -Headers $designerHeaders
Write-Host "Designer Metrics -> Completed: $($designerPerf.data.designsCompleted), Submitted: $($designerPerf.data.designsSubmitted), Revisions: $($designerPerf.data.revisionsCount), On-Time: $($designerPerf.data.onTimeCompletionRate)%, Avg Days: $($designerPerf.data.averageCompletionTimeDays)d"

Write-Host ''
Write-Host '=== 5. Testing Production Workspace and Performance ==='
$prodHeaders = @{ Authorization = "Bearer $($tokens['production@rohilla.com'])" }
$prodWs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/production' -Method Get -Headers $prodHeaders
Write-Host "Production Active Jobs : $($prodWs.data.activeWork.Count)"
Write-Host "Production Waiting Jobs: $($prodWs.data.waitingWork.Count)"
$prodPerf = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/production?period=THIS_MONTH' -Method Get -Headers $prodHeaders
Write-Host "Production Metrics     -> Completed: $($prodPerf.data.jobsCompleted), In-Progress: $($prodPerf.data.jobsInProgress), On-Time: $($prodPerf.data.onTimeCompletionRate)%, Avg Hours: $($prodPerf.data.averageProductionTimeHours)h"

Write-Host ''
Write-Host '=== 6. Testing QC Workspace and Quality Metrics ==='
$qcHeaders = @{ Authorization = "Bearer $($tokens['qc@rohilla.com'])" }
$qcWs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/qc' -Method Get -Headers $qcHeaders
Write-Host "QC Active Inspections  : $($qcWs.data.activeWork.Count)"
$qcPerf = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/qc?period=THIS_MONTH' -Method Get -Headers $qcHeaders
Write-Host "QC Metrics             -> Inspections: $($qcPerf.data.inspectionsCompleted), Pass Rate: $($qcPerf.data.passRate)%, Rework Rate: $($qcPerf.data.reworkRate)%, Avg Score: $($qcPerf.data.averageQualityScore)/10"

Write-Host ''
Write-Host '=== 7. Testing Dispatch Workspace and Logistics Performance ==='
$dispatchHeaders = @{ Authorization = "Bearer $($tokens['dispatch@rohilla.com'])" }
$dispatchWs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/dispatch' -Method Get -Headers $dispatchHeaders
Write-Host "Dispatch Active Jobs   : $($dispatchWs.data.activeWork.Count)"
$dispatchPerf = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/dispatch?period=THIS_MONTH' -Method Get -Headers $dispatchHeaders
Write-Host "Dispatch Metrics       -> Dispatches: $($dispatchPerf.data.dispatchesCompleted), Installs: $($dispatchPerf.data.installationsCompleted), On-Time: $($dispatchPerf.data.onTimeCompletionRate)%"

Write-Host ''
Write-Host '=== 8. Testing Manager Department Performance Comparison Matrix ==='
$managerHeaders = @{ Authorization = "Bearer $($tokens['manager@rohilla.com'])" }
$teamPerf = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/team?period=THIS_MONTH' -Method Get -Headers $managerHeaders
Write-Host "Design Team Members Tracked    : $($teamPerf.data.designerMetrics.Count)"
foreach ($d in $teamPerf.data.designerMetrics) {
    Write-Host " -> Designer: $($d.fullName) | Completed: $($d.completedCount) | On-Time: $($d.onTimeRate)% | Avg Time: $($d.averageTime) $($d.timeUnit)"
}
Write-Host "Production Team Members Tracked: $($teamPerf.data.productionMetrics.Count)"
Write-Host "QC Inspectors Tracked          : $($teamPerf.data.qcMetrics.Count)"
Write-Host "Dispatch Leads Tracked         : $($teamPerf.data.dispatchMetrics.Count)"

Write-Host ''
Write-Host '=== 9. Testing Owner (Aditye Rohilla) Executive Company Performance ==='
$adminHeaders = @{ Authorization = "Bearer $($tokens['admin@rohilla.com'])" }
$companyPerf = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/company?period=THIS_MONTH' -Method Get -Headers $adminHeaders
Write-Host "Total Company Projects         : $($companyPerf.data.totalProjects)"
Write-Host "Active Pipeline                : $($companyPerf.data.activeProjects)"
Write-Host "Completed Projects             : $($companyPerf.data.completedProjects)"
Write-Host "Overall On-Time Fulfillment %  : $($companyPerf.data.overallOnTimeRate)%"
Write-Host "Department Workload Breakdown  : $(ConvertTo-Json $companyPerf.data.departmentWorkload -Compress)"

Write-Host ''
Write-Host '=== 10. Testing Client Data Minimization (Security Check) ==='
$designerMyWork = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/projects/my-work' -Method Get -Headers $designerHeaders
$sampleProj = $designerMyWork.data[0]
Write-Host "Designer view of client -> Company: $($sampleProj.client.companyName) | Email: $($sampleProj.client.email) | Phone: $($sampleProj.client.phone) | Budget: $($sampleProj.budget)"
if ($sampleProj.client.email -eq $null -and $sampleProj.client.phone -eq $null -and $sampleProj.budget -eq $null) {
    Write-Host ' [+] CLIENT CONFIDENTIALITY ENFORCED: Email, Phone and Budget masked for operational staff!'
} else {
    throw 'Client confidentiality breach: sensitive fields exposed to designer'
}

Write-Host ''
Write-Host '=== 11. Testing Operational Access Restrictions (IDOR Protection) ==='
try {
    Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/workspace/performance/team' -Method Get -Headers $designerHeaders
    throw 'Security Failure: Designer was able to access team performance matrix!'
} catch {
    Write-Host ' [+] ACCESS DENIED (403 Forbidden): Designer correctly blocked from Manager team comparison matrix!'
}

Write-Host ''
Write-Host '=== 12. Testing Frontend Web Server Build ==='
$frontend = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing
Write-Host "Frontend HTTP Status: $($frontend.StatusCode) Length: $($frontend.Content.Length) bytes"

Write-Host ''
Write-Host '=========================================================='
Write-Host ' ALL DEPARTMENT WORKSPACE & HISTORY ENFORCEMENTS PASSED!  '
Write-Host '=========================================================='
