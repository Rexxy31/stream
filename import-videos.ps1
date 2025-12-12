# PowerShell script to import videos with proper hierarchical structure

Write-Host "=== Ultimate Java Mastery - Hierarchical Video Import Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if application is running
Write-Host "Checking if application is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/courses" -Method GET -ErrorAction Stop
    Write-Host "Application is running!" -ForegroundColor Green
}
catch {
    Write-Host "Application is not running. Please start it with: .\mvnw.cmd spring-boot:run" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Creating Course..." -ForegroundColor Yellow
$courseBody = @{
    title       = "The Ultimate Java Mastery Series"
    description = "Complete Java Programming Course - From Fundamentals to Advanced Topics"
    category    = "Programming"
} | ConvertTo-Json

$course = Invoke-RestMethod -Uri "http://localhost:8080/api/courses" -Method POST -Body $courseBody -ContentType "application/json"
$courseId = $course.id
Write-Host "Course created with ID: $courseId" -ForegroundColor Green

# Define the course structure
$courseStructure = @{
    "Part 1 - Fundamentals"                = @(
        "1. Getting Started",
        "2. Types",
        "3. Control Flow",
        "4. Clean Coding",
        "5. Debugging and Deploying Applications"
    )
    "Part 2 - Object Oriented Programming" = @(
        "1. Getting Started",
        "2. Classes",
        "3. Refactoring Towards an Object-oriented Design",
        "4. Inheritance",
        "5. Interfaces"
    )
    "Part 3 - Advanced Topics"             = @(
        "1. Getting Started",
        "2. Exceptions (43m)",
        "3. Generics (43m)",
        "4. Collections (1h)",
        "5. Lambda Expressions and Functional Interfaces (44m)",
        "6. Streams (1h)",
        "7. Concurrency and Multi-threading (1h)",
        "8. The Executive Framework (70m)"
    )
}

# Store created IDs for lookup
$moduleIds = @{}
$lessonGroupIds = @{}

Write-Host ""
Write-Host "Step 2: Creating Modules and Lesson Groups..." -ForegroundColor Yellow

$moduleOrder = @("Part 1 - Fundamentals", "Part 2 - Object Oriented Programming", "Part 3 - Advanced Topics")

foreach ($moduleName in $moduleOrder) {
    $lessonGroups = $courseStructure[$moduleName]
    
    Write-Host ""
    Write-Host "  Creating Module: $moduleName" -ForegroundColor Cyan
    
    $moduleBody = @{
        courseId = $courseId
        title    = $moduleName
        duration = "Multiple hours"
    } | ConvertTo-Json
    
    $module = Invoke-RestMethod -Uri "http://localhost:8080/api/modules" -Method POST -Body $moduleBody -ContentType "application/json"
    $moduleIds[$moduleName] = $module.id
    Write-Host "    Module created with ID: $($module.id)" -ForegroundColor Green
    
    foreach ($lessonGroupName in $lessonGroups) {
        Write-Host "      Creating Lesson Group: $lessonGroupName" -ForegroundColor White
        
        $lessonGroupBody = @{
            moduleId = $module.id
            title    = $lessonGroupName
        } | ConvertTo-Json
        
        $lessonGroup = Invoke-RestMethod -Uri "http://localhost:8080/api/lesson-groups" -Method POST -Body $lessonGroupBody -ContentType "application/json"
        
        # Create a lookup key: "ModuleName|LessonGroupName"
        $lookupKey = "$moduleName|$lessonGroupName"
        $lessonGroupIds[$lookupKey] = $lessonGroup.id
        Write-Host "        Lesson Group created with ID: $($lessonGroup.id)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 3: Importing videos from CSV..." -ForegroundColor Yellow
$csvPath = "ultimate-java-mastery.csv"

if (!(Test-Path $csvPath)) {
    Write-Host "CSV file not found: $csvPath" -ForegroundColor Red
    Write-Host "Please make sure ultimate-java-mastery.csv is in the current directory" -ForegroundColor Red
    exit 1
}

# Read and parse CSV
$videos = Import-Csv $csvPath

# Group videos by their folder path
$videosByFolder = @{}
foreach ($video in $videos) {
    $folderPath = $video."Folder Path"
    if (-not $videosByFolder.ContainsKey($folderPath)) {
        $videosByFolder[$folderPath] = @()
    }
    $videosByFolder[$folderPath] += $video
}

Write-Host "Found $($videos.Count) videos in $($videosByFolder.Keys.Count) lesson groups" -ForegroundColor Cyan

$totalImported = 0
$totalErrors = 0
$errors = @()

foreach ($folderPath in $videosByFolder.Keys) {
    # Parse folder path: "The Ultimate Java Mastery Series/Part X - Name/Lesson Group Name"
    $parts = $folderPath -split "/"
    
    if ($parts.Count -ge 3) {
        $moduleName = $parts[1]  # "Part 1 - Fundamentals", etc.
        $lessonGroupName = $parts[2]  # "1. Getting Started", etc.
        
        $lookupKey = "$moduleName|$lessonGroupName"
        
        if ($lessonGroupIds.ContainsKey($lookupKey)) {
            $lessonGroupId = $lessonGroupIds[$lookupKey]
            $videosInGroup = $videosByFolder[$folderPath]
            
            Write-Host ""
            Write-Host "  Importing $($videosInGroup.Count) videos to: $moduleName / $lessonGroupName" -ForegroundColor White
            
            foreach ($video in $videosInGroup) {
                $fileName = $video."File Name"
                $fileId = $video."File ID"
                $mimeType = $video."MIME Type"
                
                # Skip non-video files (like .zip and .pdf files)
                if ($mimeType -notlike "video/*") {
                    Write-Host "    Skipping non-video: $fileName" -ForegroundColor DarkGray
                    continue
                }
                
                # Extract lesson title from filename (remove extension and leading number)
                $lessonTitle = $fileName -replace "\.mp4$", ""
                
                try {
                    $lessonBody = @{
                        lessonGroupId     = $lessonGroupId
                        title             = $lessonTitle
                        googleDriveFileId = $fileId
                        mimeType          = $mimeType
                    } | ConvertTo-Json
                    
                    $lesson = Invoke-RestMethod -Uri "http://localhost:8080/api/lessons" -Method POST -Body $lessonBody -ContentType "application/json"
                    $totalImported++
                    Write-Host "    + $lessonTitle" -ForegroundColor Green
                }
                catch {
                    $totalErrors++
                    $errors += "Failed to import: $fileName - $($_.Exception.Message)"
                    Write-Host "    x $lessonTitle - Error: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        else {
            Write-Host "  Warning: No matching lesson group found for: $folderPath" -ForegroundColor Yellow
            $totalErrors += $videosByFolder[$folderPath].Count
            foreach ($video in $videosByFolder[$folderPath]) {
                $errors += "No lesson group match: $($video.'File Name') in $folderPath"
            }
        }
    }
    else {
        Write-Host "  Warning: Invalid folder path format: $folderPath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Import Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Course ID: $courseId" -ForegroundColor White
Write-Host "  Modules Created: $($moduleIds.Count)" -ForegroundColor White
Write-Host "  Lesson Groups Created: $($lessonGroupIds.Count)" -ForegroundColor White
Write-Host "  Videos Imported: $totalImported" -ForegroundColor White
Write-Host "  Errors: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "White" })

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Errors:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "View course hierarchy:" -ForegroundColor Yellow
$hierarchyUrl = "http://localhost:8080/api/streaming/courses/$courseId/hierarchy"
Write-Host "  $hierarchyUrl" -ForegroundColor White
