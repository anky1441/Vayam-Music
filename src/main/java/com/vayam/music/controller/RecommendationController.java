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
}
