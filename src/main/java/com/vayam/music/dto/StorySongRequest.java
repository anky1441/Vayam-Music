package com.vayam.music.dto;

import jakarta.validation.constraints.NotBlank;

public record StorySongRequest(@NotBlank String vibe) {}
