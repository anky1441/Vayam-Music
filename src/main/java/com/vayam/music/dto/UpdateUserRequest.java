package com.vayam.music.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateUserRequest(
        String name,
        String bio,
        @JsonAlias({"avatar", "photoUrl", "photo", "picture", "avatar_url"})
        String avatarUrl
) {}
