package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LessonDTO {
    private String id;
    private String lessonGroupId;
    private String title;
    private String duration;
    private String resourcePath;
    private Integer orderIndex;
    private String courseId;
}
