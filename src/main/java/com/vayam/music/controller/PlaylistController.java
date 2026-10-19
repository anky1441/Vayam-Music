package com.vayam.music.controller;

import com.vayam.music.dto.CreatePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {
    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) { this.playlistService = playlistService; }

    @PostMapping
    public PlaylistResponse create(@Valid @RequestBody CreatePlaylistRequest request, Authentication auth) {
        return playlistService.create(userId(auth), request);
    }

    @GetMapping
    public List<PlaylistResponse> mine(Authentication auth) {
        return playlistService.myPlaylists(userId(auth));
    }

    @GetMapping("/{id}")
    public PlaylistResponse get(@PathVariable Long id) { return playlistService.get(id); }

    @PostMapping("/{playlistId}/songs/{songId}")
    public void addSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        playlistService.addSong(userId(auth), playlistId, songId);
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    public void removeSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        playlistService.removeSong(userId(auth), playlistId, songId);
    }

    private Long userId(Authentication authentication) { return (Long) authentication.getDetails(); }
}