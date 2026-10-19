package com.vayam.music.controller;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.service.LikeService;
import com.vayam.music.service.SongService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{id}")
    public SongResponse get(@PathVariable Long id) { return songService.get(id); }

    @GetMapping("/mood/{mood}")
    public List<SongResponse> mood(@PathVariable String mood) { return songService.byMood(mood); }

    @GetMapping("/vibe/{vibe}")
    public List<SongResponse> vibe(@PathVariable String vibe) { return songService.byVibe(vibe); }

    @PostMapping("/{songId}/like")
    public void like(@PathVariable Long songId, Authentication authentication) {
        likeService.like(userId(authentication), songId);
    }

    @DeleteMapping("/{songId}/like")
    public void unlike(@PathVariable Long songId, Authentication authentication) {
        likeService.unlike(userId(authentication), songId);
    }

    @GetMapping("/liked")
    public List<SongResponse> liked(Authentication authentication) {
        return likeService.myLikes(userId(authentication));
    }

    private Long userId(Authentication authentication) { return (Long) authentication.getDetails(); }
}
