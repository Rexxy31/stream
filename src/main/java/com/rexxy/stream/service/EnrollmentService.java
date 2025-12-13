package com.rexxy.stream.service;

import com.rexxy.stream.dto.EnrollmentDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Enrollment;
import com.rexxy.stream.model.User;
import com.rexxy.stream.repository.CourseRepository;
import com.rexxy.stream.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final com.rexxy.stream.repository.UserProgressRepository userProgressRepository;
    private final com.rexxy.stream.repository.LessonRepository lessonRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
            CourseRepository courseRepository,
            com.rexxy.stream.repository.UserProgressRepository userProgressRepository,
            com.rexxy.stream.repository.LessonRepository lessonRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userProgressRepository = userProgressRepository;
        this.lessonRepository = lessonRepository;
    }

    /**
     * Enroll a user in a course
     */
    public EnrollmentDTO enroll(User user, String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        // Check if already enrolled
        if (enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId)) {
            // Return existing enrollment
            Enrollment existing = enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "courseId", courseId));
            return convertToDTO(existing);
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        enrollment.setStatus(Enrollment.EnrollmentStatus.ACTIVE);
        enrollment.setEnrolledAt(LocalDateTime.now());

        Enrollment saved = enrollmentRepository.save(enrollment);
        return convertToDTO(saved);
    }

    /**
     * Get all enrollments for a user
     */
    public List<EnrollmentDTO> getEnrollments(User user) {
        return enrollmentRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get active enrollments for a user
     */
    public List<EnrollmentDTO> getActiveEnrollments(User user) {
        return enrollmentRepository.findByUserIdAndStatus(user.getId(), Enrollment.EnrollmentStatus.ACTIVE)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Check if a user is enrolled in a course
     */
    public boolean isEnrolled(User user, String courseId) {
        return enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId);
    }

    /**
     * Cancel enrollment
     */
    public void cancelEnrollment(User user, String courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "courseId", courseId));

        enrollment.setStatus(Enrollment.EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
    }

    /**
     * Mark course as completed
     */
    public EnrollmentDTO markAsCompleted(User user, String courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "courseId", courseId));

        enrollment.setStatus(Enrollment.EnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);
        return convertToDTO(saved);
    }

    /**
     * Get enrollment count for a course
     */
    public long getEnrollmentCount(String courseId) {
        return enrollmentRepository.countByCourseId(courseId);
    }

    private EnrollmentDTO convertToDTO(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        return new EnrollmentDTO(
                enrollment.getId(),
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getCategory(),
                enrollment.getStatus(),
                enrollment.getEnrolledAt() != null ? enrollment.getEnrolledAt().toString() : null,
                enrollment.getCompletedAt() != null ? enrollment.getCompletedAt().toString() : null,
                calculateProgress(enrollment));
    }

    private int calculateProgress(Enrollment enrollment) {
        if (enrollment.getStatus() == Enrollment.EnrollmentStatus.COMPLETED) {
            return 100;
        }

        String userId = enrollment.getUser().getId();
        String courseId = enrollment.getCourse().getId();

        long totalLessons = lessonRepository.countByCourseId(courseId);
        if (totalLessons == 0)
            return 0;

        long completedLessons = userProgressRepository.countCompletedLessons(userId, courseId);

        return (int) ((completedLessons * 100) / totalLessons);
    }
}
