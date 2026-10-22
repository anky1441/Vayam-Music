package com.vayam.music.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePlaylistRequest(
        @NotBlank String name,
        String description
) {}
