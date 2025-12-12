package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProgressRequest {
    private String lessonId;
    private Integer watchedSeconds;
    private Integer totalDurationSeconds;
    private Boolean completed;
}
