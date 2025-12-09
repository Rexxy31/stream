package com.rexxy.stream.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service for handling Google Drive video streaming and file management
 */
@Service
public class GoogleDriveService {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE_READONLY);

    @Value("${google.drive.credentials.path:google-credentials.json}")
    private String credentialsPath;

    @Value("${google.drive.folder.id:}")
    private String defaultFolderId;

    private Drive driveService;

    /**
     * Initialize Google Drive service with credentials
     */
    private Drive getDriveService() throws IOException, GeneralSecurityException {
        if (driveService == null) {
            final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

            // Check if credentials file exists
            java.io.File credFile = new java.io.File(credentialsPath);
            if (!credFile.exists()) {
                throw new IllegalStateException(
                        "Google Drive credentials file not found at: " + credentialsPath + "\n" +
                                "Please follow the setup guide in GOOGLE_DRIVE_SETUP.md to configure Google Drive API.\n"
                                +
                                "For now, you can use the CSV import feature which doesn't require Google Drive API setup.");
            }

            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new FileInputStream(credentialsPath))
                    .createScoped(SCOPES);

            driveService = new Drive.Builder(HTTP_TRANSPORT, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                    .setApplicationName("Streaming App")
                    .build();
        }
        return driveService;
    }

    /**
     * List all video files in a Google Drive folder
     * 
     * @param folderId Google Drive folder ID
     * @return List of video files
     */
    public List<VideoFileInfo> listVideosInFolder(String folderId) throws IOException, GeneralSecurityException {
        Drive service = getDriveService();
        List<VideoFileInfo> videos = new ArrayList<>();

        String pageToken = null;
        do {
            FileList result = service.files().list()
                    .setQ("'" + folderId
                            + "' in parents and (mimeType contains 'video/' or mimeType = 'application/octet-stream') and trashed = false")
                    .setSpaces("drive")
                    .setFields("nextPageToken, files(id, name, mimeType, size, createdTime, videoMediaMetadata)")
                    .setPageToken(pageToken)
                    .execute();

            for (File file : result.getFiles()) {
                VideoFileInfo info = new VideoFileInfo();
                info.setFileId(file.getId());
                info.setFileName(file.getName());
                info.setMimeType(file.getMimeType());
                info.setSize(file.getSize());
                info.setCreatedTime(file.getCreatedTime() != null ? file.getCreatedTime().toString() : null);

                // Extract video duration if available
                if (file.getVideoMediaMetadata() != null && file.getVideoMediaMetadata().getDurationMillis() != null) {
                    long durationMillis = file.getVideoMediaMetadata().getDurationMillis();
                    info.setDuration(formatDuration(durationMillis));
                }

                videos.add(info);
            }

            pageToken = result.getNextPageToken();
        } while (pageToken != null);

        return videos;
    }

    /**
     * List all videos in the default configured folder
     */
    public List<VideoFileInfo> listVideosInDefaultFolder() throws IOException, GeneralSecurityException {
        if (defaultFolderId == null || defaultFolderId.isEmpty()) {
            throw new IllegalStateException(
                    "Default folder ID not configured. Set google.drive.folder.id in application.properties");
        }
        return listVideosInFolder(defaultFolderId);
    }

    /**
     * Generate direct download URL from Google Drive file ID
     * 
     * @param fileId Google Drive file ID
     * @return Direct download URL
     */
    public String getDirectDownloadUrl(String fileId) {
        return "https://drive.google.com/uc?export=download&id=" + fileId;
    }

    /**
     * Generate streaming URL for video player
     * 
     * @param fileId Google Drive file ID
     * @return Streaming URL
     */
    public String getStreamingUrl(String fileId) {
        return "https://drive.google.com/file/d/" + fileId + "/preview";
    }

    /**
     * Check if a resource path is a Google Drive file ID
     * 
     * @param resourcePath Resource path from database
     * @return true if it's a Google Drive file ID (not a local path)
     */
    public boolean isGoogleDriveResource(String resourcePath) {
        return resourcePath != null && !resourcePath.contains("/") && !resourcePath.contains("\\");
    }

    /**
     * Format duration from milliseconds to HH:MM:SS or MM:SS
     */
    private String formatDuration(long millis) {
        long seconds = millis / 1000;
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;

        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, secs);
        } else {
            return String.format("%d:%02d", minutes, secs);
        }
    }

    /**
     * DTO for video file information from Google Drive
     */
    public static class VideoFileInfo {
        private String fileId;
        private String fileName;
        private String mimeType;
        private Long size;
        private String createdTime;
        private String duration;

        // Getters and setters
        public String getFileId() {
            return fileId;
        }

        public void setFileId(String fileId) {
            this.fileId = fileId;
        }

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getMimeType() {
            return mimeType;
        }

        public void setMimeType(String mimeType) {
            this.mimeType = mimeType;
        }

        public Long getSize() {
            return size;
        }

        public void setSize(Long size) {
            this.size = size;
        }

        public String getCreatedTime() {
            return createdTime;
        }

        public void setCreatedTime(String createdTime) {
            this.createdTime = createdTime;
        }

        public String getDuration() {
            return duration;
        }

        public void setDuration(String duration) {
            this.duration = duration;
        }
    }
}
