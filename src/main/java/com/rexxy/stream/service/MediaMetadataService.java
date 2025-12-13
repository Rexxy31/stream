package com.rexxy.stream.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
public class MediaMetadataService {

    /**
     * Extracts the duration of a video file using ffprobe.
     * 
     * @param path Path to the video file
     * @return Duration in seconds (as a double), or 0 if extraction fails
     */
    public double getDuration(Path path) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    path.toAbsolutePath().toString());

            Process process = processBuilder.start();

            // Read output
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                if (line != null) {
                    process.waitFor(5, TimeUnit.SECONDS);
                    return Double.parseDouble(line.trim());
                }
            }

        } catch (IOException | InterruptedException | NumberFormatException e) {
            System.err.println("Failed to extract duration for " + path + ": " + e.getMessage());
        }
        return 0;
    }

    /**
     * Formats duration in seconds to HH:MM:SS string
     */
    public String formatDuration(double durationInSeconds) {
        long seconds = Math.round(durationInSeconds);
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;

        if (hours > 0) {
            return String.format("%02d:%02d:%02d", hours, minutes, secs);
        } else {
            return String.format("%02d:%02d", minutes, secs);
        }
    }
}
