package com.rexxy.stream.controller;

import com.rexxy.stream.dto.VideoUploadResponse;
import com.rexxy.stream.service.VideoStreamingService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/videos")
public class VideoStreamingController {
    private final VideoStreamingService videoStreamingService;

    public VideoStreamingController(VideoStreamingService videoStreamingService) {
        this.videoStreamingService = videoStreamingService;
    }

    @PostMapping("/upload")
    public ResponseEntity<VideoUploadResponse> uploadVideo(@RequestParam("file") MultipartFile file) {
        VideoUploadResponse response = videoStreamingService.uploadVideo(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/stream/{filename}")
    public ResponseEntity<Resource> streamVideo(
            @PathVariable String filename,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {

        Resource resource = videoStreamingService.loadVideoAsResource(filename);
        Path filePath = videoStreamingService.getFilePath(filename);
        long fileSize = Files.size(filePath);
        String contentType = Files.probeContentType(filePath);

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        // If no range header, return the entire file
        if (rangeHeader == null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentLength(fileSize)
                    .body(resource);
        }

        // Parse range header (e.g., "bytes=0-1023")
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long rangeStart = Long.parseLong(ranges[0]);
        long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty()
                ? Long.parseLong(ranges[1])
                : fileSize - 1;

        if (rangeEnd > fileSize - 1) {
            rangeEnd = fileSize - 1;
        }

        long contentLength = rangeEnd - rangeStart + 1;

        // For range requests, we need to return a 206 Partial Content response
        // Note: For a production implementation, you'd want to use InputStreamResource
        // with proper byte range reading. This is a simplified version.
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + rangeStart + "-" + rangeEnd + "/" + fileSize)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @GetMapping("/{filename}/info")
    public ResponseEntity<?> getVideoInfo(@PathVariable String filename) throws IOException {
        Path filePath = videoStreamingService.getFilePath(filename);

        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        long fileSize = Files.size(filePath);
        String contentType = Files.probeContentType(filePath);

        return ResponseEntity.ok()
                .body(new VideoInfo(filename, fileSize, contentType));
    }

    // Inner class for video info response
    private record VideoInfo(String filename, long size, String contentType) {
    }
}
