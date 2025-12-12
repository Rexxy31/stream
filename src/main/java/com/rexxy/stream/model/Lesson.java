package com.rexxy.stream.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "lessons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {
    @Id
    private String id;

    private String title;
    private String duration;
    private Integer orderIndex; // For sorting lessons within a group

    private String resourcePath; // File path for LOCAL or Google Drive file ID for GOOGLE_DRIVE
    private StorageType storageType; // LOCAL or GOOGLE_DRIVE

    @DBRef
    private LessonGroup lessonGroup;

}
