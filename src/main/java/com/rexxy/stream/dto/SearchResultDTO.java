package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchResultDTO {
    private List<CourseResult> courses;
    private List<ModuleResult> modules;
    private List<LessonResult> lessons;
    private int totalResults;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CourseResult {
        private String id;
        private String title;
        private String description;
        private String category;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ModuleResult {
        private String id;
        private String title;
        private String courseId;
        private String courseTitle;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LessonResult {
        private String id;
        private String title;
        private String lessonGroupId;
        private String lessonGroupTitle;
        private String moduleTitle;
        private String courseTitle;
    }
}
