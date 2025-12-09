package com.rexxy.stream.controller;

import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.StorageType;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Controller for importing videos from CSV file
 */
@RestController
@RequestMapping("/api/csv-import")
public class CsvImportController {

    private final LessonRepository lessonRepository;
    private final LessonGroupRepository lessonGroupRepository;

    public CsvImportController(LessonRepository lessonRepository,
            LessonGroupRepository lessonGroupRepository) {
        this.lessonRepository = lessonRepository;
        this.lessonGroupRepository = lessonGroupRepository;
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
                        lesson.setDuration(duration);
                        lesson.setResourcePath(fileId);
                        lesson.setStorageType(StorageType.GOOGLE_DRIVE);
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
