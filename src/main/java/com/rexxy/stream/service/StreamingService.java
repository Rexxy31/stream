package com.rexxy.stream.service;

import com.rexxy.stream.dto.CourseDTO;
import com.rexxy.stream.dto.CourseHierarchyDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
import com.rexxy.stream.repository.CourseRepository;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.repository.ModuleRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StreamingService {
        private final CourseRepository courseRepository;
        private final ModuleRepository moduleRepository;
        private final LessonGroupRepository lessonGroupRepository;
        private final LessonRepository lessonRepository;

        public StreamingService(CourseRepository courseRepository,
                        ModuleRepository moduleRepository,
                        LessonGroupRepository lessonGroupRepository,
                        LessonRepository lessonRepository) {
                this.courseRepository = courseRepository;
                this.moduleRepository = moduleRepository;
                this.lessonGroupRepository = lessonGroupRepository;
                this.lessonRepository = lessonRepository;
        }

        @Cacheable(value = "courses")
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

        @Cacheable(value = "courseHierarchy", key = "#courseId")
        public CourseHierarchyDTO getCourseHierarchy(String courseId) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

                CourseHierarchyDTO dto = new CourseHierarchyDTO();
                dto.setId(course.getId());
                dto.setTitle(course.getTitle());
                dto.setDescription(course.getDescription());
                dto.setCategory(course.getCategory());
                dto.setCreatedAt(course.getCreateDate().toString());

                // Query modules by courseId
                List<Module> modules = moduleRepository.findByCourse_Id(courseId);

                // Batch fetch LessonGroups
                List<LessonGroup> allGroups = lessonGroupRepository.findByModuleIn(modules);

                // Group in memory
                Map<String, List<LessonGroup>> groupsByModule = allGroups.stream()
                                .collect(Collectors.groupingBy(g -> g.getModule().getId()));

                // Assemble DTOs
                List<CourseHierarchyDTO.ModuleHierarchyDTO> moduleDTOs = modules.stream()
                                .sorted(Comparator.comparing(Module::getOrderIndex,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .map(module -> {
                                        CourseHierarchyDTO.ModuleHierarchyDTO moduleDTO = new CourseHierarchyDTO.ModuleHierarchyDTO();
                                        moduleDTO.setId(module.getId());
                                        moduleDTO.setTitle(module.getTitle());
                                        moduleDTO.setDuration(module.getDuration());

                                        List<LessonGroup> moduleGroups = groupsByModule.getOrDefault(module.getId(),
                                                        List.of());
                                        List<CourseHierarchyDTO.LessonGroupHierarchyDTO> groupDTOs = moduleGroups
                                                        .stream()
                                                        .sorted(Comparator.comparing(LessonGroup::getOrderIndex,
                                                                        Comparator.nullsLast(
                                                                                        Comparator.naturalOrder())))
                                                        .map(group -> {
                                                                CourseHierarchyDTO.LessonGroupHierarchyDTO groupDTO = new CourseHierarchyDTO.LessonGroupHierarchyDTO();
                                                                groupDTO.setId(group.getId());
                                                                groupDTO.setTitle(group.getTitle());

                                                                List<Lesson> groupLessons = group.getLessons();
                                                                if (groupLessons == null) {
                                                                        groupLessons = Collections.emptyList();
                                                                }

                                                                List<CourseHierarchyDTO.LessonHierarchyDTO> lessonDTOs = groupLessons
                                                                                .stream()
                                                                                .sorted(Comparator.comparing(
                                                                                                Lesson::getOrderIndex,
                                                                                                Comparator.nullsLast(
                                                                                                                Comparator.naturalOrder())))
                                                                                .map(this::convertLessonToHierarchy)
                                                                                .collect(Collectors.toList());

                                                                groupDTO.setLessons(lessonDTOs);
                                                                return groupDTO;
                                                        })
                                                        .collect(Collectors.toList());

                                        moduleDTO.setLessonGroups(groupDTOs);
                                        return moduleDTO;
                                })
                                .collect(Collectors.toList());

                dto.setModules(moduleDTOs);
                return dto;
        }

        private CourseHierarchyDTO.LessonHierarchyDTO convertLessonToHierarchy(Lesson lesson) {
                CourseHierarchyDTO.LessonHierarchyDTO dto = new CourseHierarchyDTO.LessonHierarchyDTO();
                dto.setId(lesson.getId());
                dto.setTitle(lesson.getTitle());
                dto.setDuration(lesson.getDuration());
                dto.setDescription(lesson.getDescription());
                dto.setResourcePath(lesson.getResourcePath());
                return dto;
        }
}
