package com.rexxy.stream.config;

import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.repository.LessonRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
public class LessonDataFixer {

    @Bean
    @Order(2)
    CommandLineRunner fixLessonData(LessonRepository lessonRepository) {
        return args -> {
            List<Lesson> allLessons = lessonRepository.findAll();

            // Find lessons WITH video data (duration has file ID, length > 10)
            Map<String, Lesson> lessonsWithVideo = allLessons.stream()
                    .filter(l -> l.getDuration() != null && l.getDuration().length() > 10)
                    .collect(Collectors.toMap(
                            l -> normalizeTitle(l.getTitle()),
                            l -> l,
                            (a, b) -> a // keep first if duplicate
            ));

            System.out.println("Found " + lessonsWithVideo.size() + " lessons WITH video data");

            // Find lessons WITHOUT video data and update them
            int updated = 0;
            for (Lesson lesson : allLessons) {
                // Skip if already has valid resourcePath (Drive file ID)
                if (lesson.getResourcePath() != null && lesson.getResourcePath().length() > 10
                        && !lesson.getResourcePath().contains("/")) {
                    continue;
                }

                // Skip if this IS a source lesson (has Drive ID in duration)
                if (lesson.getDuration() != null && lesson.getDuration().length() > 10) {
                    continue;
                }

                String normalized = normalizeTitle(lesson.getTitle());
                Lesson source = lessonsWithVideo.get(normalized);

                if (source != null) {
                    // Copy video data: duration has file ID, resourcePath has mime type
                    lesson.setResourcePath(source.getDuration()); // File ID goes to resourcePath
                    lesson.setDuration(null); // Clear duration
                    lessonRepository.save(lesson);
                    updated++;
                    System.out.println("✅ Updated: " + lesson.getTitle());
                }
            }

            if (updated > 0) {
                System.out.println("Fixed " + updated + " lessons with video data!");
            } else {
                System.out.println("✓ All lessons already have video data.");
            }
        };
    }

    private String normalizeTitle(String title) {
        if (title == null)
            return "";
        // Remove .mp4 extension and normalize
        return title.toLowerCase()
                .replace(".mp4", "")
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }
}
