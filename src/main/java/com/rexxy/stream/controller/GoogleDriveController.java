package com.rexxy.stream.controller;

import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.StorageType;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.service.GoogleDriveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Controller for bulk importing videos from Google Drive
 */
@RestController
@RequestMapping("/api/google-drive")
public class GoogleDriveController {

    private final GoogleDriveService googleDriveService;
    private final LessonRepository lessonRepository;
    private final LessonGroupRepository lessonGroupRepository;

    public GoogleDriveController(GoogleDriveService googleDriveService,
            LessonRepository lessonRepository,
            LessonGroupRepository lessonGroupRepository) {
        this.googleDriveService = googleDriveService;
        this.lessonRepository = lessonRepository;
        this.lessonGroupRepository = lessonGroupRepository;
    }

    /**
     * List all videos in the configured Google Drive folder
     */
    @GetMapping("/videos")
    public ResponseEntity<List<GoogleDriveService.VideoFileInfo>> listVideos() {
        try {
            List<GoogleDriveService.VideoFileInfo> videos = googleDriveService.listVideosInDefaultFolder();
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * List videos in a specific folder
     */
    @GetMapping("/videos/folder/{folderId}")
    public ResponseEntity<List<GoogleDriveService.VideoFileInfo>> listVideosInFolder(@PathVariable String folderId) {
        try {
            List<GoogleDriveService.VideoFileInfo> videos = googleDriveService.listVideosInFolder(folderId);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Bulk import videos from Google Drive folder to a lesson group
     * 
     * @param lessonGroupId The lesson group to add videos to
     * @param folderId      Optional folder ID (uses default if not provided)
     */
    @PostMapping("/import/{lessonGroupId}")
    public ResponseEntity<BulkImportResponse> bulkImportVideos(
            @PathVariable String lessonGroupId,
            @RequestParam(required = false) String folderId) {
        try {
            // Verify lesson group exists
            LessonGroup lessonGroup = lessonGroupRepository.findById(lessonGroupId)
                    .orElseThrow(() -> new RuntimeException("Lesson group not found"));

            // Get videos from folder
            List<GoogleDriveService.VideoFileInfo> videos;
            if (folderId != null && !folderId.isEmpty()) {
                videos = googleDriveService.listVideosInFolder(folderId);
            } else {
                videos = googleDriveService.listVideosInDefaultFolder();
            }

            // Create lessons for each video
            List<Lesson> createdLessons = new ArrayList<>();
            for (GoogleDriveService.VideoFileInfo video : videos) {
                Lesson lesson = new Lesson();
                lesson.setTitle(cleanFileName(video.getFileName()));
                lesson.setDuration(video.getDuration() != null ? video.getDuration() : "0:00");
                lesson.setResourcePath(video.getFileId());
                lesson.setStorageType(StorageType.GOOGLE_DRIVE);
                lesson.setLessonGroup(lessonGroup);

                Lesson saved = lessonRepository.save(lesson);
                createdLessons.add(saved);
            }

            BulkImportResponse response = new BulkImportResponse();
            response.setTotalVideos(videos.size());
            response.setImportedCount(createdLessons.size());
            response.setLessonGroupId(lessonGroupId);
            response.setMessage("Successfully imported " + createdLessons.size() + " videos");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            BulkImportResponse response = new BulkImportResponse();
            response.setTotalVideos(0);
            response.setImportedCount(0);
            response.setMessage("Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Clean up file name by removing extension and formatting
     */
    private String cleanFileName(String fileName) {
        // Remove file extension
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            fileName = fileName.substring(0, lastDot);
        }

        // Replace underscores and hyphens with spaces
        fileName = fileName.replace('_', ' ').replace('-', ' ');

        return fileName;
    }

    /**
     * Response DTO for bulk import operation
     */
    public static class BulkImportResponse {
        private int totalVideos;
        private int importedCount;
        private String lessonGroupId;
        private String message;

        public int getTotalVideos() {
            return totalVideos;
        }

        public void setTotalVideos(int totalVideos) {
            this.totalVideos = totalVideos;
        }

        public int getImportedCount() {
            return importedCount;
        }

        public void setImportedCount(int importedCount) {
            this.importedCount = importedCount;
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
