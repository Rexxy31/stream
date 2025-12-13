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
import org.springframework.transaction.annotation.Transactional;

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
                                                course.getThumbnail(),
                                                course.getCreateDate().toString(),
                                                new java.util.ArrayList<>(course.getTags())))
                                .collect(Collectors.toList());
        }

        @Cacheable(value = "courseHierarchyV2", key = "#courseId")
        @Transactional(readOnly = true)
        public CourseHierarchyDTO getCourseHierarchy(String courseId) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

                CourseHierarchyDTO dto = new CourseHierarchyDTO();
                dto.setId(course.getId());
                dto.setTitle(course.getTitle());
                dto.setDescription(course.getDescription());
                dto.setCategory(course.getCategory());
                dto.setThumbnail(course.getThumbnail());
                dto.setCreatedAt(course.getCreateDate().toString());
                dto.setTags(new java.util.ArrayList<>(course.getTags()));

                // Query modules by courseId
                List<Module> modules = moduleRepository.findByCourseId(courseId);

                // Batch fetch LessonGroups
                List<LessonGroup> allGroups = lessonGroupRepository.findByModuleIn(modules);

                // Batch fetch Lessons
                List<Lesson> allLessons = lessonRepository.findByLessonGroupIn(allGroups);
                Map<String, List<Lesson>> lessonsByGroup = allLessons.stream()
                                .filter(l -> l.getLessonGroup() != null)
                                .collect(Collectors.groupingBy(l -> l.getLessonGroup().getId()));

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

                                                                List<Lesson> groupLessons = lessonsByGroup.getOrDefault(
                                                                                group.getId(), Collections.emptyList());

                                                                // Calculate group duration
                                                                List<String> lessonDurations = groupLessons.stream()
                                                                                .map(Lesson::getDuration)
                                                                                .collect(Collectors.toList());
                                                                String groupDuration = sumDurations(lessonDurations);
                                                                groupDTO.setDuration(groupDuration);

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

                                        // Calculate module duration
                                        List<String> groupDurations = groupDTOs.stream()
                                                        .map(CourseHierarchyDTO.LessonGroupHierarchyDTO::getDuration)
                                                        .collect(Collectors.toList());
                                        moduleDTO.setDuration(sumDurations(groupDurations));
                                        return moduleDTO;
                                })
                                .collect(Collectors.toList());

                // Calculate course duration
                List<String> moduleDurations = moduleDTOs.stream()
                                .map(CourseHierarchyDTO.ModuleHierarchyDTO::getDuration)
                                .collect(Collectors.toList());
                dto.setDuration(sumDurations(moduleDurations));

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

        private String sumDurations(List<String> durations) {
                long totalSeconds = 0;
                for (String duration : durations) {
                        if (duration == null || duration.isEmpty())
                                continue;
                        try {
                                String[] parts = duration.split(":");
                                int h = 0, m = 0, s = 0;
                                if (parts.length == 3) {
                                        h = Integer.parseInt(parts[0]);
                                        m = Integer.parseInt(parts[1]);
                                        s = Integer.parseInt(parts[2]);
                                } else if (parts.length == 2) {
                                        m = Integer.parseInt(parts[0]);
                                        s = Integer.parseInt(parts[1]);
                                }
                                totalSeconds += (h * 3600) + (m * 60) + s;
                        } catch (NumberFormatException ignored) {
                        }
                }

                long hours = totalSeconds / 3600;
                long minutes = (totalSeconds % 3600) / 60;
                long seconds = totalSeconds % 60;

                if (hours > 0) {
                        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
                } else {
                        return String.format("%02d:%02d", minutes, seconds);
                }
        }
}
