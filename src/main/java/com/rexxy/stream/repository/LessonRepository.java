package com.rexxy.stream.repository;

import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, String> {
    List<Lesson> findByLessonGroupId(String lessonGroupId);

    List<Lesson> findByLessonGroupIn(List<LessonGroup> lessonGroups);

    List<Lesson> findByDurationIsNullAndResourcePathIsNotNull();
}
