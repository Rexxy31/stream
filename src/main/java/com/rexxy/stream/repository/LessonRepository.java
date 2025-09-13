package com.rexxy.stream.repository;

import com.rexxy.stream.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson,Integer> {
    List<Lesson> findByLessonGroup_Id(Integer lessonGroupId);
}
