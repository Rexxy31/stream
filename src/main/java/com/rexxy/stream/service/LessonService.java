package com.rexxy.stream.service;

import com.rexxy.stream.dto.LessonDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonService {
    private final LessonRepository lessonRepository;
    private final LessonGroupRepository lessonGroupRepository;

    public LessonService(LessonRepository lessonRepository, LessonGroupRepository lessonGroupRepository) {
        this.lessonRepository = lessonRepository;
        this.lessonGroupRepository = lessonGroupRepository;
    }

    public List<LessonDTO> getAllLessons() {
        return lessonRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Lesson::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public LessonDTO getLessonById(String id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", id));
        return convertToDTO(lesson);
    }

    public List<LessonDTO> getLessonsByLessonGroupId(String lessonGroupId) {
        // Verify lesson group exists
        lessonGroupRepository.findById(lessonGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("LessonGroup", "id", lessonGroupId));

        return lessonRepository.findByLessonGroupId(lessonGroupId)
                .stream()
                .sorted(Comparator.comparing(Lesson::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "courseHierarchy", allEntries = true)
    public LessonDTO createLesson(LessonDTO lessonDTO) {
        LessonGroup lessonGroup = lessonGroupRepository.findById(lessonDTO.getLessonGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("LessonGroup", "id", lessonDTO.getLessonGroupId()));

        Lesson lesson = new Lesson();
        lesson.setLessonGroup(lessonGroup);
        lesson.setTitle(lessonDTO.getTitle());
        lesson.setDuration(lessonDTO.getDuration());
        lesson.setResourcePath(lessonDTO.getResourcePath());
        lesson.setOrderIndex(lessonDTO.getOrderIndex());

        Lesson savedLesson = lessonRepository.save(lesson);
        return convertToDTO(savedLesson);
    }

    @CacheEvict(value = "courseHierarchy", allEntries = true)
    public LessonDTO updateLesson(String id, LessonDTO lessonDTO) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", id));

        if (lessonDTO.getLessonGroupId() != lesson.getLessonGroup().getId()) {
            LessonGroup lessonGroup = lessonGroupRepository.findById(lessonDTO.getLessonGroupId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("LessonGroup", "id", lessonDTO.getLessonGroupId()));
            lesson.setLessonGroup(lessonGroup);
        }

        lesson.setTitle(lessonDTO.getTitle());
        lesson.setDuration(lessonDTO.getDuration());
        lesson.setResourcePath(lessonDTO.getResourcePath());
        lesson.setOrderIndex(lessonDTO.getOrderIndex());

        Lesson updatedLesson = lessonRepository.save(lesson);
        return convertToDTO(updatedLesson);
    }

    @CacheEvict(value = "courseHierarchy", allEntries = true)
    public void deleteLesson(String id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", id));
        lessonRepository.delete(lesson);
    }

    private LessonDTO convertToDTO(Lesson lesson) {
        return new LessonDTO(
                lesson.getId(),
                lesson.getLessonGroup().getId(),
                lesson.getTitle(),
                lesson.getDuration(),
                lesson.getResourcePath(),
                lesson.getOrderIndex());
    }
}
