package com.vayam.music.dto;

import com.vayam.music.model.User;

<<<<<<< HEAD
public record UserResponse(Long id, String name, String email, String avatarUrl, String provider) {
    public UserResponse(Long id, String name, String email) {
        this(id, name, email, null, "LOCAL");
    }

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getProvider() != null ? user.getProvider() : "LOCAL"
        );
=======
public record UserResponse(Long id, String name, String email) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
>>>>>>> aa469ed8f3ae6a2a739ff58d10e3bf3b74f1cb83
    }
}
