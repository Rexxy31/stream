package com.rexxy.stream.service;

import com.rexxy.stream.dto.SearchResultDTO;
import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
import com.rexxy.stream.repository.CourseRepository;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.repository.ModuleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonGroupRepository lessonGroupRepository;
    private final LessonRepository lessonRepository;

    public SearchService(CourseRepository courseRepository,
            ModuleRepository moduleRepository,
            LessonGroupRepository lessonGroupRepository,
            LessonRepository lessonRepository) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonGroupRepository = lessonGroupRepository;
        this.lessonRepository = lessonRepository;
    }

    /**
     * Search across courses, modules, and lessons
     */
    public SearchResultDTO search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return new SearchResultDTO(List.of(), List.of(), List.of(), 0);
        }

        String searchTerm = query.trim().toLowerCase();
        Pattern pattern = Pattern.compile(Pattern.quote(searchTerm), Pattern.CASE_INSENSITIVE);

        // Search courses
        List<SearchResultDTO.CourseResult> courseResults = courseRepository.findAll().stream()
                .filter(course -> matchesCourse(course, pattern))
                .map(this::toCourseResult)
                .collect(Collectors.toList());

        // Search modules
        List<SearchResultDTO.ModuleResult> moduleResults = moduleRepository.findAll().stream()
                .filter(module -> matchesModule(module, pattern))
                .map(this::toModuleResult)
                .collect(Collectors.toList());

        // Search lessons
        List<SearchResultDTO.LessonResult> lessonResults = lessonRepository.findAll().stream()
                .filter(lesson -> matchesLesson(lesson, pattern))
                .map(this::toLessonResult)
                .collect(Collectors.toList());

        int total = courseResults.size() + moduleResults.size() + lessonResults.size();
        return new SearchResultDTO(courseResults, moduleResults, lessonResults, total);
    }

    private boolean matchesCourse(Course course, Pattern pattern) {
        return pattern.matcher(course.getTitle()).find() ||
                (course.getDescription() != null && pattern.matcher(course.getDescription()).find()) ||
                (course.getCategory() != null && pattern.matcher(course.getCategory()).find());
    }

    private boolean matchesModule(Module module, Pattern pattern) {
        return pattern.matcher(module.getTitle()).find();
    }

    private boolean matchesLesson(Lesson lesson, Pattern pattern) {
        return pattern.matcher(lesson.getTitle()).find();
    }

    private SearchResultDTO.CourseResult toCourseResult(Course course) {
        return new SearchResultDTO.CourseResult(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getCategory());
    }

    private SearchResultDTO.ModuleResult toModuleResult(Module module) {
        Course course = module.getCourse();
        return new SearchResultDTO.ModuleResult(
                module.getId(),
                module.getTitle(),
                course != null ? course.getId() : null,
                course != null ? course.getTitle() : "Unknown Course");
    }

    private SearchResultDTO.LessonResult toLessonResult(Lesson lesson) {
        LessonGroup group = lesson.getLessonGroup();
        if (group == null) {
            return new SearchResultDTO.LessonResult(
                    lesson.getId(), lesson.getTitle(), null, "Unknown Group", "Unknown Module", "Unknown Course");
        }

        Module module = group.getModule();
        if (module == null) {
            return new SearchResultDTO.LessonResult(
                    lesson.getId(), lesson.getTitle(), group.getId(), group.getTitle(), "Unknown Module",
                    "Unknown Course");
        }

        Course course = module.getCourse();
        return new SearchResultDTO.LessonResult(
                lesson.getId(),
                lesson.getTitle(),
                group.getId(),
                group.getTitle(),
                module.getTitle(),
                course != null ? course.getTitle() : "Unknown Course");
    }
}
