package com.rexxy.stream.service;

import com.rexxy.stream.dto.CourseDTO;
import com.rexxy.stream.dto.CourseHierarchyDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
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
                        course.getCreateDate().toString()))
                .collect(Collectors.toList());
    }

    public CourseHierarchyDTO getCourseHierarchy(String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        CourseHierarchyDTO dto = new CourseHierarchyDTO();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setCategory(course.getCategory());
        dto.setCreatedAt(course.getCreateDate().toString());

        // Note: This assumes eager loading or will cause N+1 queries
        // For production, consider using JOIN FETCH or DTOs with projections
        List<CourseHierarchyDTO.ModuleHierarchyDTO> modules = course.getModules() != null
                ? course.getModules().stream()
                        .map(this::convertModuleToHierarchy)
                        .collect(Collectors.toList())
                : List.of();

        dto.setModules(modules);
        return dto;
    }

    private CourseHierarchyDTO.ModuleHierarchyDTO convertModuleToHierarchy(Module module) {
        CourseHierarchyDTO.ModuleHierarchyDTO dto = new CourseHierarchyDTO.ModuleHierarchyDTO();
        dto.setId(module.getId());
        dto.setTitle(module.getTitle());
        dto.setDuration(module.getDuration());

        List<CourseHierarchyDTO.LessonGroupHierarchyDTO> lessonGroups = module.getLessonGroups() != null
                ? module.getLessonGroups().stream()
                        .map(this::convertLessonGroupToHierarchy)
                        .collect(Collectors.toList())
                : List.of();

        dto.setLessonGroups(lessonGroups);
        return dto;
    }

    private CourseHierarchyDTO.LessonGroupHierarchyDTO convertLessonGroupToHierarchy(LessonGroup lessonGroup) {
        CourseHierarchyDTO.LessonGroupHierarchyDTO dto = new CourseHierarchyDTO.LessonGroupHierarchyDTO();
        dto.setId(lessonGroup.getId());
        dto.setTitle(lessonGroup.getTitle());

        List<CourseHierarchyDTO.LessonHierarchyDTO> lessons = lessonGroup.getLessons() != null
                ? lessonGroup.getLessons().stream()
                        .map(this::convertLessonToHierarchy)
                        .collect(Collectors.toList())
                : List.of();

        dto.setLessons(lessons);
        return dto;
    }

    private CourseHierarchyDTO.LessonHierarchyDTO convertLessonToHierarchy(Lesson lesson) {
        CourseHierarchyDTO.LessonHierarchyDTO dto = new CourseHierarchyDTO.LessonHierarchyDTO();
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setDuration(lesson.getDuration());
        dto.setResourcePath(lesson.getResourcePath());
        return dto;
    }
}
