package com.vayam.music.controller;

import com.vayam.music.dto.RecommendationRequest;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public List<SongResponse> recommend(@RequestBody(required = false) RecommendationRequest request) {
        return recommendationService.recommend(request != null ? request : new RecommendationRequest(null, null, null));
    }

    @GetMapping
    public List<SongResponse> defaultRecommendations(@RequestParam(required = false) String mood,
                                                     @RequestParam(required = false) String prompt,
                                                     @RequestParam(required = false) Long likedSongId) {
        return recommendationService.recommend(new RecommendationRequest(mood, likedSongId, prompt));
    }

    @GetMapping("/mood/{mood}")
    public List<SongResponse> mood(@PathVariable String mood) {
        return recommendationService.recommend(new RecommendationRequest(mood, null, null));
    }
}
