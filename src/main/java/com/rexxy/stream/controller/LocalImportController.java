package com.rexxy.stream.controller;

import com.rexxy.stream.config.FileStorageConfig;
import com.rexxy.stream.model.Course;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.model.Module;
import com.rexxy.stream.model.StorageType;
import com.rexxy.stream.repository.CourseRepository;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.repository.ModuleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Controller for importing courses from local folder structure
 */
@RestController
@RequestMapping("/api/import")
public class LocalImportController {

    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonGroupRepository lessonGroupRepository;
    private final LessonRepository lessonRepository;
    private final FileStorageConfig fileStorageConfig;

    public LocalImportController(CourseRepository courseRepository,
            ModuleRepository moduleRepository,
            LessonGroupRepository lessonGroupRepository,
            LessonRepository lessonRepository,
            FileStorageConfig fileStorageConfig) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonGroupRepository = lessonGroupRepository;
        this.lessonRepository = lessonRepository;
        this.fileStorageConfig = fileStorageConfig;
    }

    /**
     * Scan local library folder and import course hierarchy
     * Structure: Course/Module/LessonGroup/video.mp4
     */
    @PostMapping("/local-scan")
    @Transactional
    public ResponseEntity<ImportResponse> scanLocalLibrary() {
        ImportResponse response = new ImportResponse();
        Path libraryRoot = Paths.get(fileStorageConfig.getLocalLibraryRoot());

        if (!Files.exists(libraryRoot) || !Files.isDirectory(libraryRoot)) {
            response.setMessage("Library root does not exist: " + libraryRoot);
            return ResponseEntity.badRequest().body(response);
        }

        int coursesCreated = 0;
        int modulesCreated = 0;
        int groupsCreated = 0;
        int lessonsCreated = 0;
        List<String> errors = new ArrayList<>();

        try (Stream<Path> courseFolders = Files.list(libraryRoot)) {
            List<Path> courseList = courseFolders
                    .filter(Files::isDirectory)
                    .collect(Collectors.toList());

            for (Path courseFolder : courseList) {
                try {
                    String courseTitle = courseFolder.getFileName().toString();

                    // Skip hidden or temp folders
                    if (courseTitle.startsWith(".")) {
                        continue;
                    }

                    // Create course
                    Course course = new Course();
                    course.setTitle(cleanTitle(courseTitle));
                    course.setDescription("Imported from local library");
                    course.setCategory("General");
                    course.setCreateDate(LocalDateTime.now());
                    course = courseRepository.save(course);
                    coursesCreated++;

                    // Check if course has direct videos (flat structure) or subfolders
                    List<Path> children = Files.list(courseFolder).collect(Collectors.toList());
                    boolean hasSubfolders = children.stream().anyMatch(Files::isDirectory);
                    boolean hasVideoFiles = children.stream()
                            .anyMatch(p -> p.toString().toLowerCase().endsWith(".mp4"));

                    if (!hasSubfolders && hasVideoFiles) {
                        // Flat structure: videos directly in course folder
                        Module module = createModule(course, "Default Module", 0);
                        modulesCreated++;

                        LessonGroup group = createLessonGroup(module, "Lessons", 0);
                        groupsCreated++;

                        int lessonOrder = 0;
                        for (Path videoFile : children.stream()
                                .filter(p -> p.toString().toLowerCase().endsWith(".mp4"))
                                .sorted()
                                .collect(Collectors.toList())) {
                            createLesson(group, videoFile, libraryRoot, lessonOrder++);
                            lessonsCreated++;
                        }
                    } else {
                        // Nested structure: Course/Module/LessonGroup/videos
                        int moduleOrder = 0;
                        List<Path> moduleFolders = Files.list(courseFolder)
                                .filter(Files::isDirectory)
                                .sorted()
                                .collect(Collectors.toList());

                        for (Path moduleFolder : moduleFolders) {
                            String moduleTitle = moduleFolder.getFileName().toString();
                            Module module = createModule(course, moduleTitle, moduleOrder++);
                            modulesCreated++;

                            // Check if module has direct videos or lesson group folders
                            List<Path> moduleChildren = Files.list(moduleFolder).collect(Collectors.toList());
                            boolean moduleHasSubfolders = moduleChildren.stream().anyMatch(Files::isDirectory);
                            boolean moduleHasVideos = moduleChildren.stream()
                                    .anyMatch(p -> p.toString().toLowerCase().endsWith(".mp4"));

                            if (!moduleHasSubfolders && moduleHasVideos) {
                                // Videos directly in module folder
                                LessonGroup group = createLessonGroup(module, "Lessons", 0);
                                groupsCreated++;

                                int lessonOrder = 0;
                                for (Path videoFile : moduleChildren.stream()
                                        .filter(p -> p.toString().toLowerCase().endsWith(".mp4"))
                                        .sorted()
                                        .collect(Collectors.toList())) {
                                    createLesson(group, videoFile, libraryRoot, lessonOrder++);
                                    lessonsCreated++;
                                }
                            } else {
                                // Lesson group folders
                                int groupOrder = 0;
                                List<Path> groupFolders = Files.list(moduleFolder)
                                        .filter(Files::isDirectory)
                                        .sorted()
                                        .collect(Collectors.toList());

                                for (Path groupFolder : groupFolders) {
                                    String groupTitle = groupFolder.getFileName().toString();
                                    LessonGroup group = createLessonGroup(module, groupTitle, groupOrder++);
                                    groupsCreated++;

                                    int lessonOrder = 0;
                                    List<Path> videoFiles = Files.list(groupFolder)
                                            .filter(p -> p.toString().toLowerCase().endsWith(".mp4"))
                                            .sorted()
                                            .collect(Collectors.toList());

                                    for (Path videoFile : videoFiles) {
                                        createLesson(group, videoFile, libraryRoot, lessonOrder++);
                                        lessonsCreated++;
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    errors.add("Error processing course " + courseFolder.getFileName() + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            response.setMessage("Error scanning library: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }

        response.setCoursesCreated(coursesCreated);
        response.setModulesCreated(modulesCreated);
        response.setGroupsCreated(groupsCreated);
        response.setLessonsCreated(lessonsCreated);
        response.setErrors(errors);
        response.setMessage(String.format("Import complete: %d courses, %d modules, %d groups, %d lessons",
                coursesCreated, modulesCreated, groupsCreated, lessonsCreated));

        return ResponseEntity.ok(response);
    }

    /**
     * Clean folder name for display: replace underscores with spaces
     */
    private String cleanTitle(String folderName) {
        return folderName.replace('_', ' ').trim();
    }

    private Module createModule(Course course, String title, int orderIndex) {
        Module module = new Module();
        module.setTitle(cleanTitle(title));
        module.setCourse(course);
        module.setOrderIndex(orderIndex);
        return moduleRepository.save(module);
    }

    private LessonGroup createLessonGroup(Module module, String title, int orderIndex) {
        LessonGroup group = new LessonGroup();
        group.setTitle(cleanTitle(title));
        group.setModule(module);
        group.setOrderIndex(orderIndex);
        return lessonGroupRepository.save(group);
    }

    private Lesson createLesson(LessonGroup group, Path videoFile, Path libraryRoot, int orderIndex) {
        String fileName = videoFile.getFileName().toString();

        // Clean title: remove extension and leading number prefix
        String title = fileName;
        if (title.toLowerCase().endsWith(".mp4")) {
            title = title.substring(0, title.length() - 4);
        }
        // Remove patterns like "1- ", "1. ", "01- "
        title = title.replaceFirst("^\\d+[-.]\\s*", "");
        // Remove size suffix like "-1213K"
        title = title.replaceFirst("-\\d+K$", "");

        // Calculate relative path from library root
        String relativePath = libraryRoot.relativize(videoFile).toString().replace("\\", "/");

        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setResourcePath(relativePath);
        lesson.setStorageType(StorageType.LOCAL);
        lesson.setLessonGroup(group);
        lesson.setOrderIndex(orderIndex);
        return lessonRepository.save(lesson);
    }

    /**
     * Response DTO for import operation
     */
    public static class ImportResponse {
        private String message;
        private int coursesCreated;
        private int modulesCreated;
        private int groupsCreated;
        private int lessonsCreated;
        private List<String> errors = new ArrayList<>();

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public int getCoursesCreated() {
            return coursesCreated;
        }

        public void setCoursesCreated(int coursesCreated) {
            this.coursesCreated = coursesCreated;
        }

        public int getModulesCreated() {
            return modulesCreated;
        }

        public void setModulesCreated(int modulesCreated) {
            this.modulesCreated = modulesCreated;
        }

        public int getGroupsCreated() {
            return groupsCreated;
        }

        public void setGroupsCreated(int groupsCreated) {
            this.groupsCreated = groupsCreated;
        }

        public int getLessonsCreated() {
            return lessonsCreated;
        }

        public void setLessonsCreated(int lessonsCreated) {
            this.lessonsCreated = lessonsCreated;
        }

        public List<String> getErrors() {
            return errors;
        }

        public void setErrors(List<String> errors) {
            this.errors = errors;
        }
    }
}
