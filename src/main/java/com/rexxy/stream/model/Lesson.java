package com.rexxy.stream.model;

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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String title;
    private String duration;

    @Column(name = "resource_path")
    private String resourcePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_group_id", nullable = false)
    private LessonGroup lessonGroup;

}
