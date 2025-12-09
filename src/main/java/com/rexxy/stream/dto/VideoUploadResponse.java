package com.rexxy.stream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VideoUploadResponse {
    private String filename;
    private String message;
    private String url;
    private long size;
}
