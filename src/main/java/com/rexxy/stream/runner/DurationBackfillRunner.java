package com.rexxy.stream.runner;

import com.rexxy.stream.config.FileStorageConfig;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.repository.LessonRepository;
import com.rexxy.stream.service.MediaMetadataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Component
public class DurationBackfillRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DurationBackfillRunner.class);

    private final LessonRepository lessonRepository;
    private final MediaMetadataService mediaMetadataService;
    private final FileStorageConfig fileStorageConfig;

    public DurationBackfillRunner(LessonRepository lessonRepository,
            MediaMetadataService mediaMetadataService,
            FileStorageConfig fileStorageConfig) {
        this.lessonRepository = lessonRepository;
        this.mediaMetadataService = mediaMetadataService;
        this.fileStorageConfig = fileStorageConfig;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Checking for lessons with missing duration...");
        List<Lesson> lessons = lessonRepository.findByDurationIsNullAndResourcePathIsNotNull();

        if (lessons.isEmpty()) {
            logger.info("No lessons found with missing duration.");
            return;
        }

        logger.info("Found {} lessons with missing duration. Starting backfill...", lessons.size());

        int count = 0;
        for (Lesson lesson : lessons) {
            String resourcePath = lesson.getResourcePath();
            try {
                Path filePath = resolveFilePath(resourcePath);
                if (filePath != null && Files.exists(filePath)) {
                    double duration = mediaMetadataService.getDuration(filePath);
                    if (duration > 0) {
                        lesson.setDuration(mediaMetadataService.formatDuration(duration));
                        lessonRepository.save(lesson);
                        count++;
                        logger.debug("Updated duration for lesson '{}' ({})", lesson.getTitle(), lesson.getId());
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to backfill duration for lesson '{}': {}", lesson.getTitle(), e.getMessage());
            }
        }

        logger.info("Duration backfill completed. Updated {} out of {} lessons.", count, lessons.size());
    }

    private Path resolveFilePath(String resourcePath) {
        if (resourcePath == null)
            return null;

        try {
            if (resourcePath.contains("/")) {
                // Local Library
                String decodedPath = java.net.URLDecoder.decode(resourcePath, java.nio.charset.StandardCharsets.UTF_8);
                Path libraryRoot = Paths.get(fileStorageConfig.getLocalLibraryRoot()).toAbsolutePath().normalize();
                return libraryRoot.resolve(decodedPath).normalize();
            } else {
                // Uploaded Dir
                Path uploadRoot = Paths.get(fileStorageConfig.getUploadDir()).toAbsolutePath().normalize();
                return uploadRoot.resolve(resourcePath).normalize();
            }
        } catch (Exception e) {
            logger.warn("Could not resolve path for resource: {}", resourcePath);
            return null;
        }
    }
}
