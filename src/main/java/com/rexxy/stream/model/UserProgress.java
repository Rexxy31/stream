package com.rexxy.stream.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "user_progress")
@CompoundIndex(name = "user_lesson_idx", def = "{'user.$id': 1, 'lesson.$id': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProgress {
    @Id
    private String id;

    @DBRef
    private User user;

    @DBRef
    private Lesson lesson;

    private Integer watchedSeconds; // How many seconds the user has watched
    private Integer totalDurationSeconds; // Total video duration in seconds
    private Boolean completed; // Has the user marked this as complete?

    private LocalDateTime lastWatchedAt;
    private LocalDateTime completedAt;
}
