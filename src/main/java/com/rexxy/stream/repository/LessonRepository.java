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

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(l) FROM Lesson l JOIN l.lessonGroup lg JOIN lg.module m WHERE m.course.id = :courseId")
    long countByCourseId(@org.springframework.data.repository.query.Param("courseId") String courseId);

    List<Lesson> findByDurationIsNullAndResourcePathIsNotNull();
}
