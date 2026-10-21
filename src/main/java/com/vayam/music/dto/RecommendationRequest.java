package com.vayam.music.dto;

public record RecommendationRequest(String mood, Long likedSongId, String prompt) {}
