# Stream Application API Endpoints (Hierarchical)

This document organizes API endpoints by their logical data hierarchy.

## 1. Courses
*Top-level entity representing a complete course.*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all available courses |
| GET | `/api/courses/{id}` | Get details for a specific course |
| POST | `/api/courses` | Create a new course |
| PUT | `/api/courses/{id}` | Update course details |
| DELETE | `/api/courses/{id}` | Delete a course |
| GET | `/api/streaming/courses/{courseId}/hierarchy` | **Deep Fetch:** Get full course tree (Modules -> Groups -> Lessons) |

---

## 2. Modules
*Courses are divided into Modules (e.g., "Chapter 1: Basics").*
*Modules belong to a Course.*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/modules/course/{courseId}` | **List all modules for a specific course** |
| GET | `/api/modules/{id}` | Get details for a specific module |
| POST | `/api/modules` | Create a module (requires `courseId` in body) |
| PUT | `/api/modules/{id}` | Update a module |
| DELETE | `/api/modules/{id}` | Delete a module |

---

## 3. Lesson Groups
*Modules are divided into Lesson Groups (e.g., "Part A: Setup").*
*Lesson Groups belong to a Module.*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lesson-groups/module/{moduleId}` | **List all lesson groups for a specific module** |
| GET | `/api/lesson-groups/{id}` | Get details for a specific lesson group |
| POST | `/api/lesson-groups` | Create a group (requires `moduleId` in body) |
| PUT | `/api/lesson-groups/{id}` | Update a group |
| DELETE | `/api/lesson-groups/{id}` | Delete a group |

---

## 4. Lessons
*Lesson Groups contain individual Lessons.*
*Lessons belong to a Lesson Group and link to a Video.*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lessons/lesson-group/{groupId}` | **List all lessons for a specific group** |
| GET | `/api/lessons/{id}` | Get details for a specific lesson |
| POST | `/api/lessons` | Create a lesson (requires `lessonGroupId` and `resourcePath` in body) |
| PUT | `/api/lessons/{id}` | Update a lesson |
| DELETE | `/api/lessons/{id}` | Delete a lesson |

---

## 5. Videos
*The actual media content referenced by Lessons.*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | **Upload Video:** Returns a `filename` to be used as `resourcePath` in a Lesson |
| GET | `/api/videos/stream/{filename}` | **Stream Video:** Play the video (supports seeking) |
| GET | `/api/videos/{filename}/info` | Get video metadata (size, type) |

---

## Utility APIs

### Google Drive Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/google-drive/videos` | List videos in configured Drive folder |
| POST | `/api/google-drive/import/{groupId}` | Bulk create lessons from Drive videos into a Lesson Group |

### CSV Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/csv-import/import/{groupId}` | Bulk create lessons from a CSV file into a Lesson Group |
