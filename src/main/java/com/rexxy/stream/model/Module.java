package com.rexxy.stream.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "modules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Module {

    @Id
    private String id;

    @DBRef
    private Course course;

    private String title;
    private String duration;

    @DBRef
    private List<LessonGroup> lessonGroups;
}
