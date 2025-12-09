# CSV Import Guide

Quick guide to import your videos from the "ultimate java mastery" CSV file.

## CSV File Format

Your CSV should have one of these formats:

### Option 1: Title and File ID (2 columns)
```csv
title,fileId
Introduction to Java,1abc123xyz
Variables and Data Types,2def456uvw
Control Flow,3ghi789rst
```

### Option 2: Title, Duration, and File ID (3 columns)
```csv
title,duration,fileId
Introduction to Java,10:30,1abc123xyz
Variables and Data Types,15:45,2def456uvw
Control Flow,12:20,3ghi789rst
```

**Note:** The first line can be a header (it will be automatically skipped if it contains "title" or "name").

## How to Import

### Step 1: Prepare Your CSV File
Make sure your CSV file has the video data in one of the formats above.

### Step 2: Create Lesson Group
First, create a lesson group where you want to import the videos:

```bash
POST /api/lesson-groups
{
  "moduleId": "your-module-id",
  "title": "Ultimate Java Mastery"
}
```

You'll get back a lesson group ID, e.g., `"id": "lessonGroup123"`

### Step 3: Import CSV

Use the CSV import endpoint:

```bash
POST /api/csv-import/import/lessonGroup123
Content-Type: multipart/form-data

file: [your-csv-file]
```

### Using Postman or Similar Tool:
1. Select POST method
2. URL: `http://localhost:8080/api/csv-import/import/{lessonGroupId}`
3. Body → form-data
4. Key: `file` (type: File)
5. Value: Select your CSV file
6. Send

### Using cURL:
```bash
curl -X POST http://localhost:8080/api/csv-import/import/lessonGroup123 \
  -F "file=@ultimate-java-mastery.csv"
```

## Response

You'll get a response like:

```json
{
  "totalLines": 150,
  "importedCount": 150,
  "errorCount": 0,
  "errors": [],
  "lessonGroupId": "lessonGroup123",
  "message": "Successfully imported 150 videos"
}
```

If there are any errors, they'll be listed in the `errors` array with line numbers.

## Example CSV Files

### Minimal Example (2 columns):
```csv
title,fileId
Java Basics,1a2b3c4d5e6f
OOP Concepts,2b3c4d5e6f7g
Collections,3c4d5e6f7g8h
```

### Full Example (3 columns):
```csv
title,duration,fileId
Java Basics,10:30,1a2b3c4d5e6f
OOP Concepts,15:45,2b3c4d5e6f7g
Collections,12:20,3c4d5e6f7g8h
```

### With Header Row:
```csv
Title,Duration,Google Drive File ID
Java Basics,10:30,1a2b3c4d5e6f
OOP Concepts,15:45,2b3c4d5e6f7g
Collections,12:20,3c4d5e6f7g8h
```

## Tips

- ✅ Header row is optional (automatically detected and skipped)
- ✅ Empty lines are skipped
- ✅ Handles commas in titles (use quotes: `"Java, Part 1"`)
- ✅ Duration is optional (defaults to "0:00" if not provided)
- ✅ All videos are set to `GOOGLE_DRIVE` storage type

## That's It!

Much simpler than the Google Drive API setup - just upload your CSV and all videos are imported instantly! 🎉
