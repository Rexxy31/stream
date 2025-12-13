package com.rexxy.stream.controller;

import com.rexxy.stream.config.FileStorageConfig;
import com.rexxy.stream.dto.VideoUploadResponse;
import com.rexxy.stream.service.VideoStreamingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/videos")
public class VideoStreamingController {
    private final VideoStreamingService videoStreamingService;
    private final FileStorageConfig fileStorageConfig;

    public VideoStreamingController(VideoStreamingService videoStreamingService,
            FileStorageConfig fileStorageConfig) {
        this.videoStreamingService = videoStreamingService;
        this.fileStorageConfig = fileStorageConfig;
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

    /**
     * Stream video from local library folder
     * Path is relative to file.storage.local-library-root
     */
    @GetMapping("/library/**")
    public ResponseEntity<Resource> streamLibraryVideo(
            HttpServletRequest request,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {

        // Extract path after /api/videos/library/
        String requestUri = request.getRequestURI();
        String relativePath = requestUri.substring(requestUri.indexOf("/library/") + 9);

        // Decode URL-encoded characters
        relativePath = java.net.URLDecoder.decode(relativePath, java.nio.charset.StandardCharsets.UTF_8);

        Path libraryRoot = Paths.get(fileStorageConfig.getLocalLibraryRoot()).toAbsolutePath().normalize();
        Path filePath = libraryRoot.resolve(relativePath).normalize();

        // Security check: ensure the path is within the library root
        if (!filePath.startsWith(libraryRoot)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        long fileSize = Files.size(filePath);
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = "video/mp4";
        }

        String filename = filePath.getFileName().toString();

        // If no range header, return the entire file
        if (rangeHeader == null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(fileSize)
                    .body(resource);
        }

        // Parse range header (e.g., "bytes=0-1023")
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long rangeStart = Long.parseLong(ranges[0]);
        long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty()
                ? Long.parseLong(ranges[1])
                : Math.min(rangeStart + 1024 * 1024 - 1, fileSize - 1); // Default to 1MB chunk

        if (rangeEnd > fileSize - 1) {
            rangeEnd = fileSize - 1;
        }

        long contentLength = rangeEnd - rangeStart + 1;

        // Use RandomAccessFile to seek to the correct position and read only requested
        // bytes
        java.io.RandomAccessFile randomAccessFile = new java.io.RandomAccessFile(filePath.toFile(), "r");
        randomAccessFile.seek(rangeStart);

        // Create an InputStream that reads from the current position
        java.io.InputStream inputStream = new java.io.InputStream() {
            private long remaining = contentLength;

            @Override
            public int read() throws java.io.IOException {
                if (remaining <= 0)
                    return -1;
                remaining--;
                return randomAccessFile.read();
            }

            @Override
            public int read(byte[] b, int off, int len) throws java.io.IOException {
                if (remaining <= 0)
                    return -1;
                int toRead = (int) Math.min(len, remaining);
                int read = randomAccessFile.read(b, off, toRead);
                if (read > 0)
                    remaining -= read;
                return read;
            }

            @Override
            public void close() throws java.io.IOException {
                randomAccessFile.close();
            }
        };

        org.springframework.core.io.InputStreamResource streamResource = new org.springframework.core.io.InputStreamResource(
                inputStream);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + rangeStart + "-" + rangeEnd + "/" + fileSize)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(streamResource);
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
