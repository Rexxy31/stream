package com.rexxy.stream.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "lesson_groups")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LessonGroup {
    @Id
    private String id;

    @DBRef
    private Module module;
    private String title;
    private Integer orderIndex; // For sorting lesson groups within a module

    @DBRef
    private List<Lesson> lessons;
}
