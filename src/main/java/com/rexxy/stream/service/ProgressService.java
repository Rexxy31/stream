package com.rexxy.stream.service;

import com.rexxy.stream.dto.ProgressDTO;
import com.rexxy.stream.dto.UpdateProgressRequest;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.User;
import com.rexxy.stream.model.UserProgress;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.repository.UserProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private final UserProgressRepository progressRepository;
    private final LessonRepository lessonRepository;

    public ProgressService(UserProgressRepository progressRepository, LessonRepository lessonRepository) {
        this.progressRepository = progressRepository;
        this.lessonRepository = lessonRepository;
    }

    /**
     * Update or create progress for a lesson
     */
    public ProgressDTO updateProgress(User user, UpdateProgressRequest request) {
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", request.getLessonId()));

        // Find existing progress or create new
        UserProgress progress = progressRepository.findByUserIdAndLessonId(user.getId(), lesson.getId())
                .orElseGet(() -> {
                    UserProgress newProgress = new UserProgress();
                    newProgress.setUser(user);
                    newProgress.setLesson(lesson);
                    return newProgress;
                });

        // Update fields
        if (request.getWatchedSeconds() != null) {
            progress.setWatchedSeconds(request.getWatchedSeconds());
        }
        if (request.getTotalDurationSeconds() != null) {
            progress.setTotalDurationSeconds(request.getTotalDurationSeconds());
        }
        if (request.getCompleted() != null) {
            progress.setCompleted(request.getCompleted());
            if (request.getCompleted() && progress.getCompletedAt() == null) {
                progress.setCompletedAt(LocalDateTime.now());
            }
        }

        progress.setLastWatchedAt(LocalDateTime.now());

        UserProgress saved = progressRepository.save(progress);
        return convertToDTO(saved);
    }

    /**
     * Get progress for a specific lesson
     */
    public ProgressDTO getProgressForLesson(User user, String lessonId) {
        UserProgress progress = progressRepository.findByUserIdAndLessonId(user.getId(), lessonId)
                .orElse(null);

        if (progress == null) {
            // Return empty progress
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));

            ProgressDTO dto = new ProgressDTO();
            dto.setLessonId(lessonId);
            dto.setLessonTitle(lesson.getTitle());
            dto.setWatchedSeconds(0);
            dto.setCompleted(false);
            return dto;
        }

        return convertToDTO(progress);
    }

    /**
     * Get all progress for a user
     */
    public List<ProgressDTO> getAllProgressForUser(User user) {
        return progressRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get progress for all lessons in a course
     */
    public List<ProgressDTO> getProgressForCourse(User user, String courseId) {
        return progressRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get count of completed lessons for a user
     */
    public long getCompletedLessonCount(User user) {
        return progressRepository.countByUserIdAndCompletedTrue(user.getId());
    }

    /**
     * Get study activity (completed lessons by date) for the last 365 days
     */
    public java.util.Map<String, Long> getStudyActivity(User user) {
        List<UserProgress> completed = progressRepository.findByUserIdAndCompletedTrue(user.getId());

        return completed.stream()
                .filter(p -> p.getCompletedAt() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCompletedAt().toLocalDate().toString(),
                        Collectors.counting()));
    }

    /**
     * Mark a lesson as complete
     */
    public ProgressDTO markAsComplete(User user, String lessonId) {
        UpdateProgressRequest request = new UpdateProgressRequest();
        request.setLessonId(lessonId);
        request.setCompleted(true);
        return updateProgress(user, request);
    }

    private ProgressDTO convertToDTO(UserProgress progress) {
        return new ProgressDTO(
                progress.getId(),
                progress.getLesson().getId(),
                progress.getLesson().getTitle(),
                progress.getWatchedSeconds(),
                progress.getTotalDurationSeconds(),
                progress.getCompleted(),
                progress.getLastWatchedAt() != null ? progress.getLastWatchedAt().toString() : null,
                progress.getCompletedAt() != null ? progress.getCompletedAt().toString() : null);
    }
}
