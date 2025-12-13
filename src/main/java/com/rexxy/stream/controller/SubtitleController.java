package com.rexxy.stream.controller;

import com.rexxy.stream.config.FileStorageConfig;
import com.rexxy.stream.model.Lesson;
import com.rexxy.stream.model.StorageType;
import com.rexxy.stream.repository.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/api/videos/subtitles")
public class SubtitleController {

    private final LessonRepository lessonRepository;
    private final FileStorageConfig fileStorageConfig;

    public SubtitleController(LessonRepository lessonRepository, FileStorageConfig fileStorageConfig) {
        this.lessonRepository = lessonRepository;
        this.fileStorageConfig = fileStorageConfig;
    }

    @GetMapping("/{lessonId}")
    public ResponseEntity<String> getSubtitle(@PathVariable String lessonId) {
        Optional<Lesson> lessonOpt = lessonRepository.findById(lessonId);
        if (lessonOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Lesson lesson = lessonOpt.get();
        if (lesson.getStorageType() != StorageType.LOCAL || lesson.getResourcePath() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path libraryRoot = Paths.get(fileStorageConfig.getLocalLibraryRoot());
            // resourcePath contains forward slashes from import, normalize for OS
            String normalizedPath = lesson.getResourcePath().replace("/", java.io.File.separator);
            Path videoPath = libraryRoot.resolve(normalizedPath);

            // Assume subtitle is same name but with .en.srt or .srt
            // Try .en.srt first (as seen in file listing), then .srt
            String videoFileName = videoPath.getFileName().toString();
            String baseName = videoFileName.lastIndexOf(".") > 0
                    ? videoFileName.substring(0, videoFileName.lastIndexOf("."))
                    : videoFileName;

            Path parentDir = videoPath.getParent();
            Path subtitlePath = parentDir.resolve(baseName + ".en.srt");

            if (!Files.exists(subtitlePath)) {
                subtitlePath = parentDir.resolve(baseName + ".srt");
            }

            if (!Files.exists(subtitlePath)) {
                return ResponseEntity.notFound().build();
            }

            // Read SRT and convert to VTT
            String vttContent = convertSrtToVtt(subtitlePath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/vtt"))
                    .body(vttContent);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String convertSrtToVtt(Path srtPath) throws IOException {
        StringBuilder vtt = new StringBuilder();
        vtt.append("WEBVTT\n\n");

        try (BufferedReader reader = Files.newBufferedReader(srtPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                // SRT format:
                // 1
                // 00:00:20,000 --> 00:00:24,400
                // Text line...

                // VTT format:
                // WEBVTT
                //
                // 00:00:20.000 --> 00:00:24.400
                // Text line...

                // If line is time range, replace comma with dot
                if (line.matches("\\d{2}:\\d{2}:\\d{2},\\d{3}\\s-->\\s\\d{2}:\\d{2}:\\d{2},\\d{3}")) {
                    vtt.append(line.replace(",", ".")).append("\n");
                } else {
                    // Keep other lines (text and index numbers usually ignored by VTT parsers or
                    // acceptable)
                    // Some strictly remove indices, but browsers are usually lenient.
                    // To be safe, we can skip pure number lines if we wanted,
                    // but keeping them is usually fine for simple srt-vtt.
                    vtt.append(line).append("\n");
                }
            }
        }
        return vtt.toString();
    }
}
