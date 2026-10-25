package com.vayam.music.controller;

import com.vayam.music.dto.AddMemberRequest;
import com.vayam.music.dto.CreatePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.dto.UserResponse;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.SecurityUtils;
import com.vayam.music.service.CollaborativePlaylistService;
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
    private final CollaborativePlaylistService collaborativePlaylistService;

    public PlaylistController(PlaylistService playlistService,
                              UserRepository userRepository,
                              CollaborativePlaylistService collaborativePlaylistService) {
        this.playlistService = playlistService;
        this.userRepository = userRepository;
        this.collaborativePlaylistService = collaborativePlaylistService;
    }

    @PostMapping
    public PlaylistResponse create(@Valid @RequestBody CreatePlaylistRequest request, Authentication auth) {
        return playlistService.create(userId(auth), request);
    }

    @GetMapping
    public List<PlaylistResponse> mine(Authentication auth) {
        return playlistService.myPlaylists(userId(auth));
    }

    @GetMapping("/{id:[0-9]+}")
    public PlaylistResponse get(@PathVariable Long id) {
        return playlistService.get(id);
    }

    @GetMapping("/{id:[0-9]+}/songs")
    public List<SongResponse> getSongs(@PathVariable Long id) {
        return playlistService.get(id).songs();
    }

    @PutMapping("/{id:[0-9]+}")
    public PlaylistResponse update(@PathVariable Long id, @Valid @RequestBody CreatePlaylistRequest request, Authentication auth) {
        return playlistService.update(userId(auth), id, request);
    }

    @PatchMapping("/{id:[0-9]+}")
    public PlaylistResponse patch(@PathVariable Long id, @RequestBody CreatePlaylistRequest request, Authentication auth) {
        return playlistService.update(userId(auth), id, request);
    }

    @DeleteMapping("/{id:[0-9]+}")
    public Map<String, Object> delete(@PathVariable Long id, Authentication auth) {
        playlistService.delete(userId(auth), id);
        return Map.of("success", true, "message", "Playlist deleted successfully", "id", id);
    }

    @PostMapping("/{playlistId:[0-9]+}/songs/{songId:[0-9]+}")
    public Map<String, Object> addSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        playlistService.addSong(userId(auth), playlistId, songId);
        return Map.of("success", true, "message", "Song added to playlist", "playlistId", playlistId, "songId", songId);
    }

    @DeleteMapping("/{playlistId:[0-9]+}/songs/{songId:[0-9]+}")
    public Map<String, Object> removeSong(@PathVariable Long playlistId, @PathVariable Long songId, Authentication auth) {
        playlistService.removeSong(userId(auth), playlistId, songId);
        return Map.of("success", true, "message", "Song removed from playlist", "playlistId", playlistId, "songId", songId);
    }

    @GetMapping("/{playlistId:[0-9]+}/members")
    public List<UserResponse> getMembers(@PathVariable Long playlistId, Authentication auth) {
        if (collaborativePlaylistService == null) return List.of();
        return collaborativePlaylistService.getMembers(userId(auth), playlistId);
    }

    @PostMapping("/{playlistId:[0-9]+}/members")
    public Map<String, Object> addMember(@PathVariable Long playlistId, @Valid @RequestBody AddMemberRequest request, Authentication auth) {
        if (collaborativePlaylistService == null) return Map.of("success", false);
        collaborativePlaylistService.addMember(userId(auth), playlistId, request);
        return Map.of("success", true, "message", "Member added to playlist", "playlistId", playlistId, "userId", request.userId());
    }

    @DeleteMapping("/{playlistId:[0-9]+}/members/{targetUserId:[0-9]+}")
    public Map<String, Object> removeMember(@PathVariable Long playlistId, @PathVariable Long targetUserId, Authentication auth) {
        if (collaborativePlaylistService == null) return Map.of("success", false);
        collaborativePlaylistService.removeMember(userId(auth), playlistId, targetUserId);
        return Map.of("success", true, "message", "Member removed from playlist", "playlistId", playlistId, "userId", targetUserId);
    }

    private Long userId(Authentication authentication) {
        return SecurityUtils.getUserId(authentication, userRepository);
    }
}