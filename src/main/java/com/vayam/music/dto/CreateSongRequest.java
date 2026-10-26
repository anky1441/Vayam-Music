package com.vayam.music.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSongRequest(
        @NotBlank String title,
        @NotBlank String artist,
        String genre,
        String mood,
        String energy,
        String vibe,
        String audioUrl,
        String coverUrl
) {}
