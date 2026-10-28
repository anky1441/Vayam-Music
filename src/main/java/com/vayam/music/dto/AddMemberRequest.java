package com.vayam.music.dto;

public record AddMemberRequest(Long userId, String email) {
    public AddMemberRequest(Long userId) {
        this(userId, null);
    }
}
