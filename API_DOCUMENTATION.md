# Stream Application API Documentation

## Base URL
```
http://localhost:8080/api
```

## Courses

### Get All Courses
```http
GET /courses
```

### Get Course by ID
```http
GET /courses/{id}
```

### Get Course Hierarchy
```http
GET /courses/{courseId}/hierarchy
```
Returns complete course structure with nested modules, lesson groups, and lessons.

### Create Course
```http
POST /courses
Content-Type: application/json

{
  "title": "Course Title",
  "description": "Course Description",
  "category": "Category Name"
}
```

### Update Course
```http
PUT /courses/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description",
  "category": "Updated Category"
}
```

### Delete Course
```http
DELETE /courses/{id}
```

---

## Modules

### Get All Modules
```http
GET /modules
```

### Get Module by ID
```http
GET /modules/{id}
```

### Get Modules by Course
```http
GET /modules/course/{courseId}
```

### Create Module
```http
POST /modules
Content-Type: application/json

{
  "courseId": 1,
  "title": "Module Title",
  "duration": "2 hours"
}
```

### Update Module
```http
PUT /modules/{id}
Content-Type: application/json

{
  "courseId": 1,
  "title": "Updated Title",
  "duration": "3 hours"
}
```

### Delete Module
```http
DELETE /modules/{id}
```

---

## Lesson Groups

### Get All Lesson Groups
```http
GET /lesson-groups
```

### Get Lesson Group by ID
```http
GET /lesson-groups/{id}
```

### Get Lesson Groups by Module
```http
GET /lesson-groups/module/{moduleId}
```

### Create Lesson Group
```http
POST /lesson-groups
Content-Type: application/json

{
  "moduleId": 1,
  "title": "Lesson Group Title"
}
```

### Update Lesson Group
```http
PUT /lesson-groups/{id}
Content-Type: application/json

{
  "moduleId": 1,
  "title": "Updated Title"
}
```

### Delete Lesson Group
```http
DELETE /lesson-groups/{id}
```

---

## Lessons

### Get All Lessons
```http
GET /lessons
```

### Get Lesson by ID
```http
GET /lessons/{id}
```

### Get Lessons by Lesson Group
```http
GET /lessons/lesson-group/{lessonGroupId}
```

### Create Lesson
```http
POST /lessons
Content-Type: application/json

{
  "lessonGroupId": 1,
  "title": "Lesson Title",
  "duration": "30 minutes",
  "resourcePath": "video-filename.mp4"
}
```

### Update Lesson
```http
PUT /lessons/{id}
Content-Type: application/json

{
  "lessonGroupId": 1,
  "title": "Updated Title",
  "duration": "45 minutes",
  "resourcePath": "updated-video.mp4"
}
```

### Delete Lesson
```http
DELETE /lessons/{id}
```

---

## Videos

### Upload Video
```http
POST /videos/upload
Content-Type: multipart/form-data

file: <video file>
```

**Response:**
```json
{
  "filename": "abc123-uuid.mp4",
  "message": "File uploaded successfully",
  "url": "/api/videos/stream/abc123-uuid.mp4",
  "size": 12345678
}
```

### Stream Video
```http
GET /videos/stream/{filename}
```
Supports HTTP range requests for video seeking.

### Get Video Info
```http
GET /videos/{filename}/info
```

**Response:**
```json
{
  "filename": "abc123-uuid.mp4",
  "size": 12345678,
  "contentType": "video/mp4"
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "timestamp": "2025-11-22T14:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Course not found with id: '5'",
  "path": "/api/courses/5"
}
```

### Status Codes
- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Example Workflow

1. **Create a Course**
```bash
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Java Masterclass","description":"Complete Java course","category":"Programming"}'
```

2. **Create a Module**
```bash
curl -X POST http://localhost:8080/api/modules \
  -H "Content-Type: application/json" \
  -d '{"courseId":1,"title":"Introduction to Java","duration":"3 hours"}'
```

3. **Create a Lesson Group**
```bash
curl -X POST http://localhost:8080/api/lesson-groups \
  -H "Content-Type: application/json" \
  -d '{"moduleId":1,"title":"Getting Started"}'
```

4. **Upload a Video**
```bash
curl -X POST http://localhost:8080/api/videos/upload \
  -F "file=@/path/to/video.mp4"
```

5. **Create a Lesson with Video**
```bash
curl -X POST http://localhost:8080/api/lessons \
  -H "Content-Type: application/json" \
  -d '{"lessonGroupId":1,"title":"First Lesson","duration":"15 minutes","resourcePath":"abc123-uuid.mp4"}'
```

6. **Get Complete Course Hierarchy**
```bash
curl http://localhost:8080/api/courses/1/hierarchy
```
