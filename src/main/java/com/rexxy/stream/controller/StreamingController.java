package com.rexxy.stream.controller;

import com.rexxy.stream.dto.CourseDTO;
import com.rexxy.stream.service.StreamingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StreamingController {

    private final StreamingService streamingService;

    public StreamingController(StreamingService streamingService) {
        this.streamingService = streamingService;
    }

    @GetMapping("/courses")
    public List<CourseDTO> getAllCourses() {
        return streamingService.getAllCourses();
    }
}
