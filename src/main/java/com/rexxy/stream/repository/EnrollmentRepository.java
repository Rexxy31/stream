package com.rexxy.stream.repository;

import com.rexxy.stream.model.Enrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends MongoRepository<Enrollment, String> {
    Optional<Enrollment> findByUser_IdAndCourse_Id(String userId, String courseId);

    List<Enrollment> findByUser_Id(String userId);

    List<Enrollment> findByUser_IdAndStatus(String userId, Enrollment.EnrollmentStatus status);

    List<Enrollment> findByCourse_Id(String courseId);

    boolean existsByUser_IdAndCourse_Id(String userId, String courseId);

    long countByCourse_Id(String courseId);
}
