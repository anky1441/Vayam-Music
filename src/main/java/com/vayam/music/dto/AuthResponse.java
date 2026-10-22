package com.vayam.music.dto;

public record AuthResponse(
        String token,
        Long userId,
        String name,
        String email,
        String avatarUrl,
        String provider
) {
    public AuthResponse(String token, Long userId, String name, String email) {
        this(token, userId, name, email, null, "LOCAL");
    }

    public AuthResponse(String token, Long userId, String name, String email, String avatarUrl) {
        this(token, userId, name, email, avatarUrl, "GOOGLE");
    }
}
 