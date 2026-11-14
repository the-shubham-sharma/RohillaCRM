$ErrorActionPreference = 'Stop'

Write-Host 'Testing Public Quote Submission Endpoint...'

$quoteData = @{
    name = 'Test Customer'
    phone = '9810001111'
    productService = '3D Acrylic & LED Signage'
    quantity = 3
    size = '10x4'
    location = 'Dehradun'
    requirement = 'Test quotation request'
}

$quoteJson = $quoteData | ConvertTo-Json
Write-Host "Sending payload: $quoteJson"

try {
    $res = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/public/leads' -Method Post -Body $quoteJson -ContentType 'application/json'
    Write-Host "SUCCESS! Response: $($res | ConvertTo-Json -Depth 5)"
    Write-Host "Lead Code: $($res.data.leadCode)"
} catch {
    Write-Host "FAILED! Error: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host "Response Body: $respBody"
    }
}
