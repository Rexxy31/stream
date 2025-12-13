package com.rexxy.stream.repository;

import com.rexxy.stream.model.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, String> {
    Optional<UserProgress> findByUserIdAndLessonId(String userId, String lessonId);

    List<UserProgress> findByUserId(String userId);

    @Query("SELECT up FROM UserProgress up " +
            "JOIN up.lesson l " +
            "JOIN l.lessonGroup lg " +
            "JOIN lg.module m " +
            "WHERE up.user.id = :userId AND m.course.id = :courseId")
    List<UserProgress> findByUserIdAndCourseId(@Param("userId") String userId, @Param("courseId") String courseId);

    List<UserProgress> findByUserIdAndCompletedTrue(String userId);

    @Query("SELECT COUNT(up) FROM UserProgress up JOIN up.lesson l JOIN l.lessonGroup lg JOIN lg.module m WHERE up.user.id = :userId AND m.course.id = :courseId AND up.completed = true")
    long countCompletedLessons(@Param("userId") String userId, @Param("courseId") String courseId);

    long countByUserIdAndCompletedTrue(String userId);
}
