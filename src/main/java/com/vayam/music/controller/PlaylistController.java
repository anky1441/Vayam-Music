package com.vayam.music.controller;

import com.vayam.music.dto.CreatePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.SecurityUtils;
import com.vayam.music.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {
    private final PlaylistService playlistService;
    private final UserRepository userRepository;

    public PlaylistController(PlaylistService playlistService, UserRepository userRepository) {
        this.playlistService = playlistService;
        this.userRepository = userRepository;
    }

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
        return SecurityUtils.getUserId(authentication, userRepository);
    }
}