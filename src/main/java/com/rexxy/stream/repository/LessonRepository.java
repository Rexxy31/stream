package com.rexxy.stream.repository;

import com.rexxy.stream.model.Lesson;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface LessonRepository extends MongoRepository<Lesson, String> {
    List<Lesson> findByLessonGroup_Id(String lessonGroupId);

    @Query("{ 'lessonGroup.$id': { $in: ?0 } }")
    List<Lesson> findByLessonGroupIdIn(List<String> lessonGroupIds);
}
