# Test wallet balance API endpoint
$baseUrl = "http://localhost/fu/backend/api/wallet.php"
$userId = "test-user-123"

Write-Host "=== Testing Wallet API ===" -ForegroundColor Green

# Test 1: Get wallet balance
Write-Host "`n1. Testing GET wallet balance..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "$baseUrl`?userId=$userId&action=balance" -Method Get -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($data | ConvertTo-Json -Depth 10)" -ForegroundColor Green
} else {
    Write-Host "Failed: Status $($response.StatusCode)" -ForegroundColor Red
}

# Test 2: Check balance with amount
$requiredAmount = 5000
Write-Host "`n2. Testing check balance with amount (required: 5000)..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "$baseUrl`?userId=$userId&action=check-balance&amount=$requiredAmount" -Method Get -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Has enough: $($data.hasEnough)" -ForegroundColor Green
    Write-Host "Current balance: $($data.currentBalance)" -ForegroundColor Green
    Write-Host "Response: $($data | ConvertTo-Json -Depth 10)" -ForegroundColor Green
} else {
    Write-Host "Failed: Status $($response.StatusCode)" -ForegroundColor Red
}

# Test 3: Get transactions
Write-Host "`n3. Testing GET transaction history..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "$baseUrl`?userId=$userId&action=transactions" -Method Get -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Transactions count: $($data.data.Count)" -ForegroundColor Green
} else {
    Write-Host "Failed: Status $($response.StatusCode)" -ForegroundColor Red
}

# Test 4: Use wallet for booking (should succeed with 10000 balance)
Write-Host "`n4. Testing use wallet for booking (deduct 5000)..." -ForegroundColor Cyan
$postData = @{
    userId = $userId
    action = "use-for-booking"
    amount = 5000
    bookingId = "BK_12345"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $baseUrl -Method Post -ContentType "application/json" -Body $postData -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Success: $($data.success)" -ForegroundColor Green
    Write-Host "Message: $($data.message)" -ForegroundColor Green
    Write-Host "New balance: $($data.newBalance)" -ForegroundColor Green
} else {
    Write-Host "Failed: Status $($response.StatusCode)" -ForegroundColor Red
}

# Test 5: Use wallet with insufficient balance
Write-Host "`n5. Testing use wallet with insufficient balance (deduct 20000)..." -ForegroundColor Cyan
$postData = @{
    userId = $userId
    action = "use-for-booking"
    amount = 20000
    bookingId = "BK_99999"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Post -ContentType "application/json" -Body $postData -ErrorAction Stop
    Write-Host "Unexpected success: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $response = $_.Exception.Response
    if ($response.StatusCode -eq 400 -or $response.StatusCode -eq [System.Net.HttpStatusCode]::BadRequest) {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Status: 400 (Expected failure)" -ForegroundColor Green
        Write-Host "Message: $($errorData.message)" -ForegroundColor Green
        Write-Host "Shortfall: $($errorData.shortfall)" -ForegroundColor Green
    } else {
        Write-Host "Unexpected error: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Green
