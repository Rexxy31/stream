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
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
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

                // Query modules by courseId and sort by orderIndex
                List<Module> modules = moduleRepository.findByCourse_Id(courseId);
                List<CourseHierarchyDTO.ModuleHierarchyDTO> moduleDTOs = modules.stream()
                                .sorted(Comparator.comparing(Module::getOrderIndex,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .map(this::convertModuleToHierarchy)
                                .collect(Collectors.toList());

                dto.setModules(moduleDTOs);
                return dto;
        }

        private CourseHierarchyDTO.ModuleHierarchyDTO convertModuleToHierarchy(Module module) {
                CourseHierarchyDTO.ModuleHierarchyDTO dto = new CourseHierarchyDTO.ModuleHierarchyDTO();
                dto.setId(module.getId());
                dto.setTitle(module.getTitle());
                dto.setDuration(module.getDuration());

                // Query lesson groups by moduleId and sort by orderIndex
                List<LessonGroup> lessonGroups = lessonGroupRepository.findByModule_Id(module.getId());
                List<CourseHierarchyDTO.LessonGroupHierarchyDTO> lessonGroupDTOs = lessonGroups.stream()
                                .sorted(Comparator.comparing(LessonGroup::getOrderIndex,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .map(this::convertLessonGroupToHierarchy)
                                .collect(Collectors.toList());

                dto.setLessonGroups(lessonGroupDTOs);
                return dto;
        }

        private CourseHierarchyDTO.LessonGroupHierarchyDTO convertLessonGroupToHierarchy(LessonGroup lessonGroup) {
                CourseHierarchyDTO.LessonGroupHierarchyDTO dto = new CourseHierarchyDTO.LessonGroupHierarchyDTO();
                dto.setId(lessonGroup.getId());
                dto.setTitle(lessonGroup.getTitle());

                // Query lessons by lessonGroupId and sort by orderIndex
                List<Lesson> lessons = lessonRepository.findByLessonGroup_Id(lessonGroup.getId());
                List<CourseHierarchyDTO.LessonHierarchyDTO> lessonDTOs = lessons.stream()
                                .sorted(Comparator.comparing(Lesson::getOrderIndex,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .map(this::convertLessonToHierarchy)
                                .collect(Collectors.toList());

                dto.setLessons(lessonDTOs);
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
