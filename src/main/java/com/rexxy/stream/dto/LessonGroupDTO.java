package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LessonGroupDTO {
    private String id;
    private String moduleId;
    private String title;
}
