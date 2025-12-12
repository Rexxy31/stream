package com.rexxy.stream.repository;

import com.rexxy.stream.model.UserProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends MongoRepository<UserProgress, String> {
    Optional<UserProgress> findByUser_IdAndLesson_Id(String userId, String lessonId);

    List<UserProgress> findByUser_Id(String userId);

    List<UserProgress> findByUser_IdAndLesson_LessonGroup_Module_Course_Id(String userId, String courseId);

    List<UserProgress> findByUser_IdAndCompletedTrue(String userId);

    long countByUser_IdAndCompletedTrue(String userId);
}
