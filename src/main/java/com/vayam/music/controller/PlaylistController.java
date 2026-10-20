package com.vayam.music.controller;

import com.vayam.music.dto.CreatePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

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
    public PlaylistResponse get(@PathVariable Long id) {
        return playlistService.get(id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id, Authentication auth) {
        playlistService.delete(userId(auth), id);
        return Map.of("success", true, "message", "Playlist deleted successfully", "id", id);
    }

    @PostMapping("/{playlistId}/songs/{songId}")
    public Map<String, Object> addSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        playlistService.addSong(userId(auth), playlistId, songId);
        return Map.of("success", true, "message", "Song added to playlist", "playlistId", playlistId, "songId", songId);
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    public Map<String, Object> removeSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        playlistService.removeSong(userId(auth), playlistId, songId);
        return Map.of("success", true, "message", "Song removed from playlist", "playlistId", playlistId, "songId", songId);
    }

    private Long userId(Authentication authentication) {
        if (authentication == null || authentication.getDetails() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return (Long) authentication.getDetails();
    }
}