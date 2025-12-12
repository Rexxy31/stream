package com.rexxy.stream.controller;

import com.rexxy.stream.dto.*;
import com.rexxy.stream.model.User;
import com.rexxy.stream.repository.CourseRepository;
import com.rexxy.stream.repository.EnrollmentRepository;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.repository.ModuleRepository;
import com.rexxy.stream.repository.UserProgressRepository;
import com.rexxy.stream.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserProgressRepository progressRepository;

    public AdminController(UserRepository userRepository, CourseRepository courseRepository,
            ModuleRepository moduleRepository, LessonRepository lessonRepository,
            EnrollmentRepository enrollmentRepository, UserProgressRepository progressRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.progressRepository = progressRepository;
    }

    /**
     * Get dashboard stats (admin only)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        long totalUsers = userRepository.count();
        long totalCourses = courseRepository.count();
        long totalModules = moduleRepository.count();
        long totalLessons = lessonRepository.count();
        long totalEnrollments = enrollmentRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalCourses", totalCourses,
                "totalModules", totalModules,
                "totalLessons", totalLessons,
                "totalEnrollments", totalEnrollments));
    }

    /**
     * Get all users (admin only)
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> users = userRepository.findAll().stream()
                .map(u -> new UserDTO(
                        u.getId(),
                        u.getEmail(),
                        u.getName(),
                        u.getProfilePicture(),
                        u.getAuthProvider() != null ? u.getAuthProvider().name() : null,
                        u.getRoles(),
                        u.getCreatedAt() != null ? u.getCreatedAt().toString() : null))
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    /**
     * Make a user admin (admin only)
     */
    @PostMapping("/users/{userId}/make-admin")
    public ResponseEntity<Map<String, String>> makeAdmin(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String userId) {

        if (!isAdmin(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User targetUser = userRepository.findById(userId).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.notFound().build();
        }

        Set<User.Role> roles = targetUser.getRoles();
        if (roles == null) {
            roles = Set.of(User.Role.USER, User.Role.ADMIN);
        } else {
            roles.add(User.Role.ADMIN);
        }
        targetUser.setRoles(roles);
        userRepository.save(targetUser);

        return ResponseEntity.ok(Map.of("message", "User is now an admin"));
    }

    /**
     * Remove admin from a user (admin only)
     */
    @PostMapping("/users/{userId}/remove-admin")
    public ResponseEntity<Map<String, String>> removeAdmin(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String userId) {

        if (!isAdmin(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User targetUser = userRepository.findById(userId).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.notFound().build();
        }

        Set<User.Role> roles = targetUser.getRoles();
        if (roles != null) {
            roles.remove(User.Role.ADMIN);
            targetUser.setRoles(roles);
            userRepository.save(targetUser);
        }

        return ResponseEntity.ok(Map.of("message", "Admin role removed"));
    }

    /**
     * Update Course
     */
    @PutMapping("/courses/{id}")
    public ResponseEntity<com.rexxy.stream.model.Course> updateCourse(@AuthenticationPrincipal User user,
            @PathVariable String id, @RequestBody UpdateCourseRequest request) {
        if (!isAdmin(user))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return courseRepository.findById(id).map(course -> {
            if (request.getTitle() != null)
                course.setTitle(request.getTitle());
            if (request.getDescription() != null)
                course.setDescription(request.getDescription());
            if (request.getCategory() != null)
                course.setCategory(request.getCategory());
            return ResponseEntity.ok(courseRepository.save(course));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update Module
     */
    @PutMapping("/modules/{id}")
    public ResponseEntity<com.rexxy.stream.model.Module> updateModule(@AuthenticationPrincipal User user,
            @PathVariable String id, @RequestBody UpdateModuleRequest request) {
        if (!isAdmin(user))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return moduleRepository.findById(id).map(module -> {
            if (request.getTitle() != null)
                module.setTitle(request.getTitle());
            if (request.getOrderIndex() != null)
                module.setOrderIndex(request.getOrderIndex());
            return ResponseEntity.ok(moduleRepository.save(module));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update Lesson
     */
    @PutMapping("/lessons/{id}")
    public ResponseEntity<com.rexxy.stream.model.Lesson> updateLesson(@AuthenticationPrincipal User user,
            @PathVariable String id, @RequestBody UpdateLessonRequest request) {
        if (!isAdmin(user))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        return lessonRepository.findById(id).map(lesson -> {
            if (request.getTitle() != null)
                lesson.setTitle(request.getTitle());
            if (request.getDescription() != null)
                lesson.setDescription(request.getDescription());
            if (request.getVideoKey() != null)
                lesson.setResourcePath(request.getVideoKey());
            if (request.getOrderIndex() != null)
                lesson.setOrderIndex(request.getOrderIndex());
            return ResponseEntity.ok(lessonRepository.save(lesson));
        }).orElse(ResponseEntity.notFound().build());
    }

    private boolean isAdmin(User user) {
        if (user == null || user.getRoles() == null)
            return false;
        return user.getRoles().contains(User.Role.ADMIN);
    }
}
