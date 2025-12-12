package com.rexxy.stream.repository;

import com.rexxy.stream.model.LessonGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonGroupRepository extends MongoRepository<LessonGroup, String> {
    List<LessonGroup> findByModule_Id(String moduleId);

    @Query("{ 'module.$id': { $in: ?0 } }")
    List<LessonGroup> findByModuleIdIn(List<String> moduleIds);
}
