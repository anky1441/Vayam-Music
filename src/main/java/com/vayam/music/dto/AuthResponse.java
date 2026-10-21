package com.vayam.music.dto;

<<<<<<< HEAD
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
=======
public record AuthResponse(String token, Long userId, String name, String email) {}
>>>>>>> aa469ed8f3ae6a2a739ff58d10e3bf3b74f1cb83
 