package com.rexxy.stream.controller;

import com.rexxy.stream.dto.ProgressDTO;
import com.rexxy.stream.dto.UpdateProgressRequest;
import com.rexxy.stream.model.User;
import com.rexxy.stream.service.ProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    /**
     * Update progress for a lesson (save watch position, mark complete, etc.)
     */
    @PostMapping
    public ResponseEntity<ProgressDTO> updateProgress(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProgressRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProgressDTO progress = progressService.updateProgress(user, request);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get progress for a specific lesson
     */
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<ProgressDTO> getProgressForLesson(
            @AuthenticationPrincipal User user,
            @PathVariable String lessonId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProgressDTO progress = progressService.getProgressForLesson(user, lessonId);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get all progress for the current user
     */
    @GetMapping
    public ResponseEntity<List<ProgressDTO>> getAllProgress(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ProgressDTO> progress = progressService.getAllProgressForUser(user);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get progress for all lessons in a course
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ProgressDTO>> getProgressForCourse(
            @AuthenticationPrincipal User user,
            @PathVariable String courseId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ProgressDTO> progress = progressService.getProgressForCourse(user, courseId);
        return ResponseEntity.ok(progress);
    }

    /**
     * Mark a lesson as complete
     */
    @PostMapping("/complete/{lessonId}")
    public ResponseEntity<ProgressDTO> markAsComplete(
            @AuthenticationPrincipal User user,
            @PathVariable String lessonId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ProgressDTO progress = progressService.markAsComplete(user, lessonId);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get stats for the current user
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        long completedCount = progressService.getCompletedLessonCount(user);
        return ResponseEntity.ok(Map.of(
                "completedLessons", completedCount));
    }
}
