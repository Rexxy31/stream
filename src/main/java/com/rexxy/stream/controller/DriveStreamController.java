package com.rexxy.stream.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for streaming videos from Google Drive
 * Uses redirect to Google Drive's direct streaming URL (no API needed)
 */
@RestController
@RequestMapping("/api/drive")
public class DriveStreamController {

    /**
     * Redirect to Google Drive streaming URL
     * This uses Google Drive's built-in streaming without requiring API credentials
     */
    @GetMapping("/stream/{fileId}")
    public ResponseEntity<Void> streamVideo(@PathVariable String fileId) {
        // Validate file ID format (should be alphanumeric with underscores/hyphens)
        if (fileId == null || fileId.length() < 10 || fileId.contains("/")) {
            return ResponseEntity.badRequest().build();
        }

        // Google Drive direct download URL with streaming support
        // This URL format allows direct video playback
        String driveUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, driveUrl)
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .build();
    }

    /**
     * Get an embeddable iframe URL for the video
     */
    @GetMapping("/embed/{fileId}")
    public ResponseEntity<String> getEmbedUrl(@PathVariable String fileId) {
        String embedUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(embedUrl);
    }
}
