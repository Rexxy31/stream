package com.rexxy.stream.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="lesson_groups")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LessonGroup {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "module_id",  nullable=false)
    private Module module;
    private String title;
}
