package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProgressDTO {
    private String id;
    private String lessonId;
    private String lessonTitle;
    private Integer watchedSeconds;
    private Integer totalDurationSeconds;
    private Boolean completed;
    private String lastWatchedAt;
    private String completedAt;
}
