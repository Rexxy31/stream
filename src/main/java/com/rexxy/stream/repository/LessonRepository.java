package com.rexxy.stream.repository;

import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface LessonRepository extends MongoRepository<Lesson, String> {
    List<Lesson> findByLessonGroup_Id(String lessonGroupId);

    List<Lesson> findByLessonGroupIn(List<LessonGroup> lessonGroups);
}
