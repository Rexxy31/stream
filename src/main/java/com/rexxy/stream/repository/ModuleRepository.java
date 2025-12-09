package com.rexxy.stream.repository;

import com.rexxy.stream.model.Module;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends MongoRepository<Module, String> {
    List<Module> findByCourse_Id(String courseId);
}
