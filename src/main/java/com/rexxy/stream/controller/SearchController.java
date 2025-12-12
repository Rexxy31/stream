package com.rexxy.stream.controller;

import com.rexxy.stream.dto.SearchResultDTO;
import com.rexxy.stream.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * Search across courses, modules, and lessons
     * Example: GET /api/search?q=java
     */
    @GetMapping
    public ResponseEntity<SearchResultDTO> search(@RequestParam String q) {
        SearchResultDTO results = searchService.search(q);
        return ResponseEntity.ok(results);
    }
}
