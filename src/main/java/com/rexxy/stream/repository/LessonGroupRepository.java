package com.rexxy.stream.repository;

import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonGroupRepository extends JpaRepository<LessonGroup, String> {
    List<LessonGroup> findByModuleId(String moduleId);

    List<LessonGroup> findByModuleIn(List<Module> modules);
}
