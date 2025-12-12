package com.rexxy.stream.controller;

import com.rexxy.stream.dto.EnrollmentDTO;
import com.rexxy.stream.model.User;
import com.rexxy.stream.service.EnrollmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    /**
     * Enroll current user in a course
     */
    @PostMapping("/enroll/{courseId}")
    public ResponseEntity<EnrollmentDTO> enroll(
            @AuthenticationPrincipal User user,
            @PathVariable String courseId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        EnrollmentDTO enrollment = enrollmentService.enroll(user, courseId);
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
    }

    /**
     * Get all enrollments for current user
     */
    @GetMapping
    public ResponseEntity<List<EnrollmentDTO>> getEnrollments(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<EnrollmentDTO> enrollments = enrollmentService.getEnrollments(user);
        return ResponseEntity.ok(enrollments);
    }

    /**
     * Get active enrollments for current user
     */
    @GetMapping("/active")
    public ResponseEntity<List<EnrollmentDTO>> getActiveEnrollments(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<EnrollmentDTO> enrollments = enrollmentService.getActiveEnrollments(user);
        return ResponseEntity.ok(enrollments);
    }

    /**
     * Check if current user is enrolled in a course
     */
    @GetMapping("/check/{courseId}")
    public ResponseEntity<Map<String, Boolean>> checkEnrollment(
            @AuthenticationPrincipal User user,
            @PathVariable String courseId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean enrolled = enrollmentService.isEnrolled(user, courseId);
        return ResponseEntity.ok(Map.of("enrolled", enrolled));
    }

    /**
     * Cancel enrollment in a course
     */
    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> cancelEnrollment(
            @AuthenticationPrincipal User user,
            @PathVariable String courseId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        enrollmentService.cancelEnrollment(user, courseId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mark a course as completed
     */
    @PostMapping("/complete/{courseId}")
    public ResponseEntity<EnrollmentDTO> markAsCompleted(
            @AuthenticationPrincipal User user,
            @PathVariable String courseId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        EnrollmentDTO enrollment = enrollmentService.markAsCompleted(user, courseId);
        return ResponseEntity.ok(enrollment);
    }

    /**
     * Get enrollment count for a course (public)
     */
    @GetMapping("/count/{courseId}")
    public ResponseEntity<Map<String, Long>> getEnrollmentCount(@PathVariable String courseId) {
        long count = enrollmentService.getEnrollmentCount(courseId);
        return ResponseEntity.ok(Map.of("enrolledUsers", count));
    }
}
