package com.rexxy.stream.controller;

import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
import com.rexxy.stream.model.StorageType;
import com.rexxy.stream.repository.*;
import com.rexxy.stream.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller for importing videos from CSV file
 */
@RestController
@RequestMapping("/api/csv-import")
public class CsvImportController {

    private final LessonRepository lessonRepository;
    private final LessonGroupRepository lessonGroupRepository;
    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final LessonService lessonService;

    public CsvImportController(LessonRepository lessonRepository,
            LessonGroupRepository lessonGroupRepository,
            ModuleRepository moduleRepository,
            CourseRepository courseRepository,
            LessonService lessonService) {
        this.lessonRepository = lessonRepository;
        this.lessonGroupRepository = lessonGroupRepository;
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
        this.lessonService = lessonService;
    }

    /**
     * Import videos from CSV file
     * CSV format: title,duration,fileId
     * Example: Introduction to Java,10:30,1abc123xyz
     * 
     * @param file          CSV file with video data
     * @param lessonGroupId The lesson group to add videos to
     */
    @PostMapping("/import/{lessonGroupId}")
    public ResponseEntity<CsvImportResponse> importFromCsv(
            @RequestParam("file") MultipartFile file,
            @PathVariable String lessonGroupId) {

        CsvImportResponse response = new CsvImportResponse();

        try {
            // Verify lesson group exists
            LessonGroup lessonGroup = lessonGroupRepository.findById(lessonGroupId)
                    .orElseThrow(() -> new RuntimeException("Lesson group not found: " + lessonGroupId));

            List<Lesson> createdLessons = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            int lineNumber = 0;

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                String line;
                boolean isFirstLine = true;

                while ((line = reader.readLine()) != null) {
                    lineNumber++;

                    // Skip header line if it exists
                    if (isFirstLine && (line.toLowerCase().contains("title") || line.toLowerCase().contains("name"))) {
                        isFirstLine = false;
                        continue;
                    }
                    isFirstLine = false;

                    // Skip empty lines
                    if (line.trim().isEmpty()) {
                        continue;
                    }

                    try {
                        // Parse CSV line (handle commas in quotes)
                        String[] parts = parseCsvLine(line);

                        if (parts.length < 2) {
                            errors.add("Line " + lineNumber + ": Invalid format (need at least title and fileId)");
                            continue;
                        }

                        String title = parts[0].trim();
                        String duration = "0:00"; // default
                        String fileId;

                        // Check if we have duration (3 columns) or not (2 columns)
                        if (parts.length >= 3) {
                            duration = parts[1].trim();
                            fileId = parts[2].trim();
                        } else {
                            fileId = parts[1].trim();
                        }

                        // Create lesson
                        Lesson lesson = new Lesson();
                        lesson.setTitle(title);

                        // Try to extract duration if local file exists
                        String extracted = lessonService.extractDuration(fileId);
                        if (extracted != null) {
                            duration = extracted;
                            lesson.setStorageType(StorageType.LOCAL);
                        } else {
                            lesson.setStorageType(StorageType.GOOGLE_DRIVE);
                        }

                        lesson.setDuration(duration);
                        lesson.setResourcePath(fileId);
                        lesson.setLessonGroup(lessonGroup);

                        Lesson saved = lessonRepository.save(lesson);
                        createdLessons.add(saved);

                    } catch (Exception e) {
                        errors.add("Line " + lineNumber + ": " + e.getMessage());
                    }
                }
            }

            response.setTotalLines(lineNumber);
            response.setImportedCount(createdLessons.size());
            response.setErrorCount(errors.size());
            response.setErrors(errors);
            response.setLessonGroupId(lessonGroupId);

            if (errors.isEmpty()) {
                response.setMessage("Successfully imported " + createdLessons.size() + " videos");
            } else {
                response.setMessage("Imported " + createdLessons.size() + " videos with " + errors.size() + " errors");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setMessage("Error: " + e.getMessage());
            response.setErrorCount(1);
            response.getErrors().add(e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Import full course hierarchy from CSV
     * Format: File Name,File ID,MIME Type,Folder Path
     */
    @PostMapping("/course")
    public ResponseEntity<CsvImportResponse> importCourseFromCsv(@RequestParam("file") MultipartFile file) {
        CsvImportResponse response = new CsvImportResponse();
        int importedCount = 0;
        List<String> errors = new ArrayList<>();
        int lineNumber = 0;

        // Cache to avoid db lookups
        Map<String, Course> courseMap = new HashMap<>(); // title -> Course
        Map<String, Module> moduleMap = new HashMap<>(); // courseTitle_moduleTitle -> Module
        Map<String, LessonGroup> groupMap = new HashMap<>(); // moduleKey_groupTitle -> LessonGroup

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty())
                    continue;

                // Check header
                if (isFirstLine) {
                    if (line.toLowerCase().contains("file name")) {
                        isFirstLine = false;
                        continue;
                    }
                    isFirstLine = false;
                }

                try {
                    String[] parts = parseCsvLine(line);
                    // Expected: File Name, File ID, MIME Type, Folder Path
                    if (parts.length < 4)
                        continue; // Skip bad lines

                    String fileName = parts[0].trim();
                    String fileId = parts[1].trim();
                    String mimeType = parts[2].trim();
                    String folderPath = parts[3].trim();

                    if (!mimeType.startsWith("video"))
                        continue; // Skip non-video files

                    // Parse Hierarchy: Course / Module / LessonGroup
                    // Example: The Ultimate Java Mastery Series/Part 3 - Advanced Topics/8. The
                    // Executive Framework (70m)
                    String[] pathParts = folderPath.split("/");

                    if (pathParts.length < 1)
                        continue;

                    String courseTitle = pathParts[0].trim();
                    String moduleTitle = pathParts.length > 1 ? pathParts[1].trim() : "Default Module";
                    String groupTitle = pathParts.length > 2 ? pathParts[2].trim() : "Default Group";

                    // 1. Get/Create Course
                    Course course = courseMap.get(courseTitle);
                    if (course == null) {
                        // Check DB roughly
                        // For simplicity, always create new course object if not in map,
                        // but reality check: duplicated course names in DB?
                        // We will assume unique names for now or just standard create
                        course = new Course();
                        course.setTitle(courseTitle);
                        course.setCategory("General"); // Default
                        course.setDescription("Imported from CSV");
                        course.setCreateDate(LocalDateTime.now());
                        course.setModules(new ArrayList<>());
                        course = courseRepository.save(course);
                        courseMap.put(courseTitle, course);
                    }

                    // 2. Get/Create Module
                    String moduleKey = courseTitle + "_" + moduleTitle;
                    Module module = moduleMap.get(moduleKey);
                    if (module == null) {
                        module = new Module();
                        module.setTitle(moduleTitle);
                        module.setCourse(course);
                        module.setLessonGroups(new ArrayList<>());
                        module = moduleRepository.save(module);

                        course.getModules().add(module);
                        courseRepository.save(course); // Update parent

                        moduleMap.put(moduleKey, module);
                    }

                    // 3. Get/Create LessonGroup
                    String groupKey = moduleKey + "_" + groupTitle;
                    LessonGroup group = groupMap.get(groupKey);
                    if (group == null) {
                        group = new LessonGroup();
                        group.setTitle(groupTitle);
                        group.setModule(module);
                        group.setLessons(new ArrayList<>());
                        group = lessonGroupRepository.save(group);

                        module.getLessonGroups().add(group);
                        moduleRepository.save(module); // Update parent

                        groupMap.put(groupKey, group);
                    }

                    // 4. Create Lesson
                    // Clean title: "5- Asynchronous Programming.mp4" -> "Asynchronous Programming"
                    String lessonTitle = fileName;
                    if (lessonTitle.endsWith(".mp4")) {
                        lessonTitle = lessonTitle.substring(0, lessonTitle.length() - 4);
                    }
                    // Remove leading "X- " if present
                    if (lessonTitle.matches("^\\d+-\\s.*")) {
                        lessonTitle = lessonTitle.replaceFirst("^\\d+-\\s", "");
                    }

                    Lesson lesson = new Lesson();
                    lesson.setTitle(lessonTitle);
                    lesson.setResourcePath(fileId);
                    // Duration?
                    String duration = "0:00";
                    String extracted = lessonService.extractDuration(fileId);
                    if (extracted != null) {
                        duration = extracted;
                        lesson.setStorageType(StorageType.LOCAL);
                    }
                    lesson.setDuration(duration);

                    lesson = lessonRepository.save(lesson);

                    group.getLessons().add(lesson);
                    lessonGroupRepository.save(group);

                    importedCount++;

                } catch (Exception e) {
                    errors.add("Line " + lineNumber + ": " + e.getMessage());
                }
            }

            response.setMessage(
                    "Imported coverage: " + importedCount + " videos. Created courses: " + courseMap.size());
            response.setErrors(errors);
            response.setImportedCount(importedCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.setMessage("Error processing CSV: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Parse CSV line handling quoted fields
     */
    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());

        return result.toArray(new String[0]);
    }

    /**
     * Response DTO for CSV import operation
     */
    public static class CsvImportResponse {
        private int totalLines;
        private int importedCount;
        private int errorCount;
        private List<String> errors = new ArrayList<>();
        private String lessonGroupId;
        private String message;

        public int getTotalLines() {
            return totalLines;
        }

        public void setTotalLines(int totalLines) {
            this.totalLines = totalLines;
        }

        public int getImportedCount() {
            return importedCount;
        }

        public void setImportedCount(int importedCount) {
            this.importedCount = importedCount;
        }

        public int getErrorCount() {
            return errorCount;
        }

        public void setErrorCount(int errorCount) {
            this.errorCount = errorCount;
        }

        public List<String> getErrors() {
            return errors;
        }

        public void setErrors(List<String> errors) {
            this.errors = errors;
        }

        public String getLessonGroupId() {
            return lessonGroupId;
        }

        public void setLessonGroupId(String lessonGroupId) {
            this.lessonGroupId = lessonGroupId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
