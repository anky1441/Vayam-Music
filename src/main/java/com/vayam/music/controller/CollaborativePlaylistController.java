package com.vayam.music.controller;

import com.vayam.music.dto.AddMemberRequest;
import com.vayam.music.dto.PlaylistResponse;
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
@RequestMapping("/api/shared-playlists")
public class CollaborativePlaylistController {
    private final CollaborativePlaylistService service;
    private final PlaylistService playlistService;
    private final UserRepository userRepository;

    public CollaborativePlaylistController(CollaborativePlaylistService service,
                                           PlaylistService playlistService,
                                           UserRepository userRepository) {
        this.service = service;
        this.playlistService = playlistService;
        this.userRepository = userRepository;
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
        Long memberUserId = service.addMember(userId(auth), playlistId, request);
        return Map.of("success", true, "message", "Member added to playlist", "playlistId", playlistId, "userId", memberUserId);
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
        return SecurityUtils.getUserId(authentication, userRepository);
    }
}
