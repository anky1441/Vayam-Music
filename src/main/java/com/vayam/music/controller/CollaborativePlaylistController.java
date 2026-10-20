package com.vayam.music.controller;

import com.vayam.music.dto.AddMemberRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.service.CollaborativePlaylistService;
import com.vayam.music.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shared-playlists")
public class CollaborativePlaylistController {
    private final CollaborativePlaylistService service;
    private final PlaylistService playlistService;

    public CollaborativePlaylistController(CollaborativePlaylistService service, PlaylistService playlistService) {
        this.service = service;
        this.playlistService = playlistService;
    }

    @PostMapping("/{playlistId}/members")
    public void addMember(@PathVariable Long playlistId, @Valid @RequestBody AddMemberRequest request, Authentication auth) {
        service.addMember(userId(auth), playlistId, request);
    }

    @DeleteMapping("/{playlistId}/members/{userId}")
    public void removeMember(@PathVariable Long playlistId, @PathVariable Long userId, Authentication auth) {
        service.removeMember(userId(auth), playlistId, userId);
    }

    @PostMapping("/{playlistId}/songs/{songId}")
    public PlaylistResponse addSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        service.addSong(userId(auth), playlistId, songId);
        return playlistService.get(playlistId);
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    public PlaylistResponse removeSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        service.removeSong(userId(auth), playlistId, songId);
        return playlistService.get(playlistId);
    }

    private Long userId(Authentication authentication) { return (Long) authentication.getDetails(); }
}
