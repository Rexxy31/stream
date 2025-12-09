package com.rexxy.stream.controller;

import com.rexxy.stream.dto.LessonGroupDTO;
import com.rexxy.stream.service.LessonGroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-groups")
public class LessonGroupController {
    private final LessonGroupService lessonGroupService;

    public LessonGroupController(LessonGroupService lessonGroupService) {
        this.lessonGroupService = lessonGroupService;
    }

    @GetMapping
    public ResponseEntity<List<LessonGroupDTO>> getAllLessonGroups() {
        return ResponseEntity.ok(lessonGroupService.getAllLessonGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonGroupDTO> getLessonGroupById(@PathVariable String id) {
        return ResponseEntity.ok(lessonGroupService.getLessonGroupById(id));
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<LessonGroupDTO>> getLessonGroupsByModuleId(@PathVariable String moduleId) {
        return ResponseEntity.ok(lessonGroupService.getLessonGroupsByModuleId(moduleId));
    }

    @PostMapping
    public ResponseEntity<LessonGroupDTO> createLessonGroup(@RequestBody LessonGroupDTO lessonGroupDTO) {
        LessonGroupDTO created = lessonGroupService.createLessonGroup(lessonGroupDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LessonGroupDTO> updateLessonGroup(
            @PathVariable String id,
            @RequestBody LessonGroupDTO lessonGroupDTO) {
        return ResponseEntity.ok(lessonGroupService.updateLessonGroup(id, lessonGroupDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLessonGroup(@PathVariable String id) {
        lessonGroupService.deleteLessonGroup(id);
        return ResponseEntity.noContent().build();
    }
}
