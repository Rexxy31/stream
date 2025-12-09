# Quick Start: Import Your Videos

Your CSV file `ultimate-java-mastery.csv` has 244 videos ready to import!

## Option 1: Use the CSV As-Is (Recommended)

Your CSV format is: `File Name,File ID,MIME Type,Folder Path`

The CSV import controller will read columns 1 and 2 (File Name and File ID), which is perfect!

## Steps to Import

### 1. Start the Application

```bash
.\mvnw.cmd spring-boot:run
```

Wait for the message: `Started StreamApplication in X seconds`

### 2. Create Course Structure

Use Postman, cURL, or any HTTP client:

```bash
# Create Course
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Ultimate Java Mastery\",\"description\":\"Complete Java Programming Course\",\"category\":\"Programming\"}"

# Note the course ID from response, e.g., "67409abc123def456"

# Create Module
curl -X POST http://localhost:8080/api/modules \
  -H "Content-Type: application/json" \
  -d "{\"courseId\":\"67409abc123def456\",\"title\":\"Complete Java Series\",\"duration\":\"100 hours\"}"

# Note the module ID, e.g., "67409xyz789ghi012"

# Create Lesson Group
curl -X POST http://localhost:8080/api/lesson-groups \
  -H "Content-Type: application/json" \
  -d "{\"moduleId\":\"67409xyz789ghi012\",\"title\":\"All Videos\"}"

# Note the lesson group ID, e.g., "67409qwe345rty678"
```

### 3. Import All 244 Videos

```bash
curl -X POST http://localhost:8080/api/csv-import/import/67409qwe345rty678 \
  -F "file=@ultimate-java-mastery.csv"
```

**That's it!** All 244 videos will be imported in seconds.

## Using Postman

1. **POST** `http://localhost:8080/api/csv-import/import/{lessonGroupId}`
2. Body → form-data
3. Key: `file` (type: File)
4. Value: Select `ultimate-java-mastery.csv`
5. Send

## Expected Response

```json
{
  "totalLines": 244,
  "importedCount": 244,
  "errorCount": 0,
  "errors": [],
  "lessonGroupId": "67409qwe345rty678",
  "message": "Successfully imported 244 videos"
}
```

## Verify Import

```bash
# Get all lessons in the group
curl http://localhost:8080/api/lessons/lesson-group/67409qwe345rty678
```

You should see all 244 lessons with:
- `title`: Video file name (e.g., "5- Asynchronous Programming")
- `resourcePath`: Google Drive file ID
- `storageType`: "GOOGLE_DRIVE"
- `duration`: "0:00" (default, since CSV doesn't have duration)

## Next Steps

- Videos are now in MongoDB Atlas
- They're linked to Google Drive
- Ready to stream!

🎉 **All done in under 5 minutes!**
