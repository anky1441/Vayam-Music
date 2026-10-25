package com.vayam.music.dto;

import com.vayam.music.model.User;

public record UserResponse(Long id, String name, String email, String avatarUrl, String provider, String bio) {
    public UserResponse(Long id, String name, String email) {
        this(id, name, email, null, "LOCAL", null);
    }

    public UserResponse(Long id, String name, String email, String avatarUrl, String provider) {
        this(id, name, email, avatarUrl, provider, null);
    }

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getProvider() != null ? user.getProvider() : "LOCAL",
                user.getBio()
        );
    }
}
