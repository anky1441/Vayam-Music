package com.vayam.music.controller;

import com.vayam.music.dto.GeneratePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.service.PlaylistGeneratorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/playlists/generate")
public class PlaylistGeneratorController {
    private final PlaylistGeneratorService service;

    public PlaylistGeneratorController(PlaylistGeneratorService service) { this.service = service; }

    @PostMapping
    public PlaylistResponse generate(@Valid @RequestBody GeneratePlaylistRequest request, Authentication auth) {
        return service.generate(userId(auth), request);
    }

    private Long userId(Authentication auth) {
        if (auth == null || auth.getDetails() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return (Long) auth.getDetails();
    }
}
