package com.vayam.music.dto;

import jakarta.validation.constraints.NotBlank;

public record GeneratePlaylistRequest(@NotBlank String prompt, String name) {}
