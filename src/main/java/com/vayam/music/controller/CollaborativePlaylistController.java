package com.vayam.music.controller;

import com.vayam.music.dto.AddMemberRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.UserResponse;
import com.vayam.music.service.CollaborativePlaylistService;
import com.vayam.music.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shared-playlists")
public class CollaborativePlaylistController {
    private final CollaborativePlaylistService service;
    private final PlaylistService playlistService;

    public CollaborativePlaylistController(CollaborativePlaylistService service, PlaylistService playlistService) {
        this.service = service;
        this.playlistService = playlistService;
    }

    @GetMapping
    public List<PlaylistResponse> sharedWithMe(Authentication auth) {
        return service.getSharedWithMe(userId(auth));
    }

    @GetMapping("/{playlistId}/members")
    public List<UserResponse> getMembers(@PathVariable Long playlistId, Authentication auth) {
        return service.getMembers(userId(auth), playlistId);
    }

    @PostMapping("/{playlistId}/members")
    public Map<String, Object> addMember(@PathVariable Long playlistId, @Valid @RequestBody AddMemberRequest request, Authentication auth) {
        service.addMember(userId(auth), playlistId, request);
        return Map.of("success", true, "message", "Member added to playlist", "playlistId", playlistId, "userId", request.userId());
    }

    @DeleteMapping("/{playlistId}/members/{targetUserId}")
    public Map<String, Object> removeMember(@PathVariable Long playlistId, @PathVariable Long targetUserId, Authentication auth) {
        service.removeMember(userId(auth), playlistId, targetUserId);
        return Map.of("success", true, "message", "Member removed from playlist", "playlistId", playlistId, "userId", targetUserId);
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

    private Long userId(Authentication authentication) {
        if (authentication == null || authentication.getDetails() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return (Long) authentication.getDetails();
    }
}
