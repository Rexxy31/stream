package com.rexxy.stream.repository;

import com.rexxy.stream.model.Lesson;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface LessonRepository extends MongoRepository<Lesson, String> {
    List<Lesson> findByLessonGroup_Id(String lessonGroupId);
}
