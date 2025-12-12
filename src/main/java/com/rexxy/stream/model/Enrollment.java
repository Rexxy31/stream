package com.rexxy.stream.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "enrollments")
@CompoundIndex(name = "user_course_idx", def = "{'user.$id': 1, 'course.$id': 1}", unique = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {
    @Id
    private String id;

    @DBRef
    private User user;

    @DBRef
    private Course course;

    private EnrollmentStatus status;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;

    public enum EnrollmentStatus {
        ACTIVE, // Currently enrolled
        COMPLETED, // Finished the course
        EXPIRED, // Enrollment expired
        CANCELLED // User cancelled
    }
}
