# PowerShell script to import videos from CSV

Write-Host "=== Ultimate Java Mastery - Video Import Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if application is running
Write-Host "Checking if application is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/courses" -Method GET -ErrorAction Stop
    Write-Host "Application is running!" -ForegroundColor Green
} catch {
    Write-Host "Application is not running. Please start it with: .\mvnw.cmd spring-boot:run" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Creating Course..." -ForegroundColor Yellow
$courseBody = @{
    title = "Ultimate Java Mastery Series"
    description = "Complete Java Programming Course - All Parts"
    category = "Programming"
} | ConvertTo-Json

$course = Invoke-RestMethod -Uri "http://localhost:8080/api/courses" -Method POST -Body $courseBody -ContentType "application/json"
$courseId = $course.id
Write-Host "Course created with ID: $courseId" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Creating Module..." -ForegroundColor Yellow
$moduleBody = @{
    courseId = $courseId
    title = "Complete Java Series"
    duration = "100+ hours"
} | ConvertTo-Json

$module = Invoke-RestMethod -Uri "http://localhost:8080/api/modules" -Method POST -Body $moduleBody -ContentType "application/json"
$moduleId = $module.id
Write-Host "Module created with ID: $moduleId" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Creating Lesson Group..." -ForegroundColor Yellow
$lessonGroupBody = @{
    moduleId = $moduleId
    title = "All Videos"
} | ConvertTo-Json

$lessonGroup = Invoke-RestMethod -Uri "http://localhost:8080/api/lesson-groups" -Method POST -Body $lessonGroupBody -ContentType "application/json"
$lessonGroupId = $lessonGroup.id
Write-Host "Lesson Group created with ID: $lessonGroupId" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Importing 244 videos from CSV..." -ForegroundColor Yellow
$csvPath = "ultimate-java-mastery.csv"

if (!(Test-Path $csvPath)) {
    Write-Host "CSV file not found: $csvPath" -ForegroundColor Red
    Write-Host "Please make sure ultimate-java-mastery.csv is in the current directory" -ForegroundColor Red
    exit 1
}

# Import CSV
$uri = "http://localhost:8080/api/csv-import/import/$lessonGroupId"
$filePath = Resolve-Path $csvPath

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"ultimate-java-mastery.csv`"",
    "Content-Type: text/csv$LF",
    (Get-Content $filePath -Raw),
    "--$boundary--$LF"
) -join $LF

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
    Write-Host "Import completed!" -ForegroundColor Green
    Write-Host "  - Total videos: $($response.importedCount)" -ForegroundColor Cyan
    Write-Host "  - Errors: $($response.errorCount)" -ForegroundColor Cyan
    
    if ($response.errorCount -gt 0) {
        Write-Host ""
        Write-Host "Errors:" -ForegroundColor Red
        foreach ($error in $response.errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
    }
    
    $importResult = $response
} catch {
    Write-Host "Import failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Import Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Course ID: $courseId" -ForegroundColor White
Write-Host "  Module ID: $moduleId" -ForegroundColor White
Write-Host "  Lesson Group ID: $lessonGroupId" -ForegroundColor White
Write-Host "  Videos Imported: $($importResult.importedCount)" -ForegroundColor White
Write-Host ""
Write-Host "View course hierarchy:" -ForegroundColor Yellow
$hierarchyUrl = "http://localhost:8080/api/streaming/courses/$courseId/hierarchy"
Write-Host "  $hierarchyUrl" -ForegroundColor White
Write-Host ""
Write-Host "View all lessons:" -ForegroundColor Yellow
$lessonsUrl = "http://localhost:8080/api/lessons/lesson-group/$lessonGroupId"
Write-Host "  $lessonsUrl" -ForegroundColor White
