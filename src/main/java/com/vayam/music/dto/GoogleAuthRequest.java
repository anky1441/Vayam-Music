package com.vayam.music.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleAuthRequest(
        @NotBlank(message = "Google ID token or credential is required")
        @JsonAlias({"id_token", "token", "credential", "accessToken", "access_token"})
        String idToken
) {}

