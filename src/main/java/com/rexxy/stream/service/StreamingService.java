package com.rexxy.stream.service;

import com.rexxy.stream.dto.CourseDTO;
import com.rexxy.stream.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StreamingService {
    private final CourseRepository courseRepository;

    public StreamingService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll()
                .stream()
                .map(course -> new CourseDTO(
                        course.getId(),
                        course.getTitle(),
                        course.getDescription(),
                        course.getCategory(),
                        course.getCreateDate().toString()
                ))
                .collect(Collectors.toList());
    }
}
