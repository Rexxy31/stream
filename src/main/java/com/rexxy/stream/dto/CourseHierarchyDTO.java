package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CourseHierarchyDTO {
    private String id;
    private String title;
    private String description;
    private String category;
    private String thumbnail;
    private String createdAt;
    private String duration;
    private java.util.List<String> tags;
    private List<ModuleHierarchyDTO> modules;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ModuleHierarchyDTO {
        private String id;
        private String title;
        private String duration;
        private List<LessonGroupHierarchyDTO> lessonGroups;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LessonGroupHierarchyDTO {
        private String id;
        private String title;
        private String duration;
        private List<LessonHierarchyDTO> lessons;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LessonHierarchyDTO {
        private String id;
        private String title;
        private String duration;
        private String description;
        private String resourcePath;
    }
}
