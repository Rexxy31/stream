package com.rexxy.stream.controller;

import com.rexxy.stream.dto.CourseHierarchyDTO;
import com.rexxy.stream.service.StreamingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/streaming")
public class StreamingController {

    private final StreamingService streamingService;

    public StreamingController(StreamingService streamingService) {
        this.streamingService = streamingService;
    }

    @GetMapping("/courses/{courseId}/hierarchy")
    public ResponseEntity<CourseHierarchyDTO> getCourseHierarchy(@PathVariable String courseId) {
        return ResponseEntity.ok(streamingService.getCourseHierarchy(courseId));
    }
}
