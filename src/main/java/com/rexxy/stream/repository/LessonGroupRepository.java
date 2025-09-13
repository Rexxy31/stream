package com.rexxy.stream.repository;

import com.rexxy.stream.model.LessonGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonGroupRepository extends JpaRepository<LessonGroup, Integer> {
    List<LessonGroup> findByModule_Id(Integer moduleId);
}
