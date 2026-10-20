package com.vayam.music.controller;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.service.LikeService;
import com.vayam.music.service.SongService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/songs")
public class SongController {
    private final SongService songService;
    private final LikeService likeService;

    public SongController(SongService songService, LikeService likeService) {
        this.songService = songService;
        this.likeService = likeService;
    }

    @GetMapping
    public List<SongResponse> all(@RequestParam(required = false) String search) {
        return search == null || search.isBlank() ? songService.all() : songService.search(search);
    }

    @GetMapping("/liked")
    public List<SongResponse> liked(Authentication authentication) {
        return likeService.myLikes(userId(authentication));
    }

    @GetMapping("/mood/{mood}")
    public List<SongResponse> mood(@PathVariable String mood) {
        return songService.byMood(mood);
    }

    @GetMapping("/vibe/{vibe}")
    public List<SongResponse> vibe(@PathVariable String vibe) {
        return songService.byVibe(vibe);
    }

    @GetMapping("/genre/{genre}")
    public List<SongResponse> genre(@PathVariable String genre) {
        return songService.byGenre(genre);
    }

    @GetMapping("/{id}")
    public SongResponse get(@PathVariable Long id) {
        return songService.get(id);
    }

    @PostMapping("/{songId}/like")
    public Map<String, Object> like(@PathVariable Long songId, Authentication authentication) {
        likeService.like(userId(authentication), songId);
        return Map.of("success", true, "songId", songId, "liked", true);
    }

    @DeleteMapping("/{songId}/like")
    public Map<String, Object> unlike(@PathVariable Long songId, Authentication authentication) {
        likeService.unlike(userId(authentication), songId);
        return Map.of("success", true, "songId", songId, "liked", false);
    }

    @GetMapping("/{songId}/is-liked")
    public Map<String, Object> isLiked(@PathVariable Long songId, Authentication authentication) {
        boolean liked = likeService.isLiked(userId(authentication), songId);
        return Map.of("songId", songId, "liked", liked);
    }

    private Long userId(Authentication authentication) {
        if (authentication == null || authentication.getDetails() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return (Long) authentication.getDetails();
    }
}
