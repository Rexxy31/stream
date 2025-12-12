package com.rexxy.stream.dto;

import com.rexxy.stream.model.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EnrollmentDTO {
    private String id;
    private String courseId;
    private String courseTitle;
    private String courseDescription;
    private String courseCategory;
    private Enrollment.EnrollmentStatus status;
    private String enrolledAt;
    private String completedAt;
}
