package com.rexxy.stream.repository;

import com.rexxy.stream.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Integer> {
    List<Module> findByCourse_Id(Integer courseId);
}
