package com.rexxy.stream.service;

import com.rexxy.stream.dto.LessonDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.LessonGroup;
import com.rexxy.stream.repository.LessonGroupRepository;
import com.rexxy.stream.repository.LessonRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LessonService {
    private final LessonRepository lessonRepository;
    private final LessonGroupRepository lessonGroupRepository;
    private final MediaMetadataService mediaMetadataService;
    private final com.rexxy.stream.config.FileStorageConfig fileStorageConfig;

    public LessonService(LessonRepository lessonRepository, LessonGroupRepository lessonGroupRepository,
            MediaMetadataService mediaMetadataService, com.rexxy.stream.config.FileStorageConfig fileStorageConfig) {
        this.lessonRepository = lessonRepository;
        this.lessonGroupRepository = lessonGroupRepository;
        this.mediaMetadataService = mediaMetadataService;
        this.fileStorageConfig = fileStorageConfig;
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

        String duration = lessonDTO.getDuration();
        if ((duration == null || duration.isEmpty()) && lessonDTO.getResourcePath() != null) {
            duration = extractDuration(lessonDTO.getResourcePath());
        }
        lesson.setDuration(duration);

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

        String duration = lessonDTO.getDuration();
        if ((duration == null || duration.isEmpty()) && lessonDTO.getResourcePath() != null
                && !lessonDTO.getResourcePath().equals(lesson.getResourcePath())) {
            duration = extractDuration(lessonDTO.getResourcePath());
        } else if (duration == null && lesson.getDuration() != null) {
            duration = lesson.getDuration();
        }
        lesson.setDuration(duration);

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

    public String extractDuration(String resourcePath) {
        if (resourcePath == null || resourcePath.length() > 255)
            return null; // Avoid processing ultra-long strings

        try {
            java.nio.file.Path filePath;
            if (resourcePath.contains("/")) {
                // Local Library
                String decodedPath = java.net.URLDecoder.decode(resourcePath, java.nio.charset.StandardCharsets.UTF_8);
                java.nio.file.Path libraryRoot = java.nio.file.Paths.get(fileStorageConfig.getLocalLibraryRoot())
                        .toAbsolutePath().normalize();
                filePath = libraryRoot.resolve(decodedPath).normalize();
            } else {
                // Uploaded Dir
                java.nio.file.Path uploadRoot = java.nio.file.Paths.get(fileStorageConfig.getUploadDir())
                        .toAbsolutePath().normalize();
                filePath = uploadRoot.resolve(resourcePath).normalize();
            }

            if (java.nio.file.Files.exists(filePath)) {
                double durationSec = mediaMetadataService.getDuration(filePath);
                if (durationSec > 0) {
                    return mediaMetadataService.formatDuration(durationSec);
                }
            }
        } catch (Exception e) {
            // Log but don't fail operation
            System.err.println("Failed to extract duration for " + resourcePath + ": " + e.getMessage());
        }
        return null;
    }

    private LessonDTO convertToDTO(Lesson lesson) {
        return new LessonDTO(
                lesson.getId(),
                lesson.getLessonGroup().getId(),
                lesson.getTitle(),
                lesson.getDuration(),
                lesson.getResourcePath(),
                lesson.getOrderIndex(),
                lesson.getLessonGroup().getModule().getCourse().getId());
    }
}
