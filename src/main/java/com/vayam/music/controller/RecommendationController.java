package com.vayam.music.controller;

import com.vayam.music.dto.RecommendationRequest;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.service.MlRecommendationClient;
import com.vayam.music.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService recommendationService;
    private final MlRecommendationClient mlClient;

    public RecommendationController(RecommendationService recommendationService,
                                    MlRecommendationClient mlClient) {
        this.recommendationService = recommendationService;
        this.mlClient = mlClient;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        boolean available = mlClient.isAvailable();
        return Map.of(
                "mlApiUrl", mlClient.getBaseUrl(),
                "available", available,
                "engine", available ? "ML Microservice (FastAPI + Scikit-Learn)" : "Hybrid Database Fallback Engine"
        );
    }

    @PostMapping
    public List<SongResponse> recommend(@RequestBody(required = false) RecommendationRequest request) {
        return recommendationService.recommend(request != null ? request : new RecommendationRequest(null, null, null));
    }

    @GetMapping
    public List<SongResponse> defaultRecommendations(@RequestParam(required = false) String mood,
                                                     @RequestParam(required = false) String prompt,
                                                     @RequestParam(required = false) Long likedSongId,
                                                     @RequestParam(required = false) String vibe,
                                                     @RequestParam(required = false) String genre) {
        String effectivePrompt = prompt;
        if (effectivePrompt == null || effectivePrompt.isBlank()) {
            if (vibe != null && !vibe.isBlank()) effectivePrompt = vibe;
            else if (genre != null && !genre.isBlank()) effectivePrompt = genre;
        }
        return recommendationService.recommend(new RecommendationRequest(mood, likedSongId, effectivePrompt));
    }

    @GetMapping("/mood/{mood}")
    public List<SongResponse> mood(@PathVariable String mood) {
        return recommendationService.recommend(new RecommendationRequest(mood, null, null));
    }

    @GetMapping("/vibe/{vibe}")
    public List<SongResponse> vibe(@PathVariable String vibe) {
        return recommendationService.recommend(new RecommendationRequest(null, null, vibe));
    }

    @GetMapping("/genre/{genre}")
    public List<SongResponse> genre(@PathVariable String genre) {
        return recommendationService.recommend(new RecommendationRequest(null, null, genre));
    }

    @GetMapping("/song/{songId:[0-9]+}")
    public List<SongResponse> song(@PathVariable Long songId) {
        return recommendationService.recommend(new RecommendationRequest(null, songId, null));
    }
}
