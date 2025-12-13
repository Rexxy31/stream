package com.rexxy.stream.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lessons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String duration;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "resource_path")
    private String resourcePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_type")
    private StorageType storageType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_group_id", nullable = false)
    @JsonIgnore
    private LessonGroup lessonGroup;
}
