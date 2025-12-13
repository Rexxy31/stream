package com.rexxy.stream.repository;

import com.rexxy.stream.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {
    Optional<Enrollment> findByUserIdAndCourseId(String userId, String courseId);

    List<Enrollment> findByUserId(String userId);

    List<Enrollment> findByUserIdAndStatus(String userId, Enrollment.EnrollmentStatus status);

    List<Enrollment> findByCourseId(String courseId);

    boolean existsByUserIdAndCourseId(String userId, String courseId);

    long countByCourseId(String courseId);
}
