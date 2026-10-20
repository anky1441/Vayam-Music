package com.vayam.music.controller;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.SecurityUtils;
import com.vayam.music.service.LikeService;
import com.vayam.music.service.SongService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/songs")
public class SongController {
    private final SongService songService;
    private final LikeService likeService;
    private final UserRepository userRepository;

    public SongController(SongService songService, LikeService likeService, UserRepository userRepository) {
        this.songService = songService;
        this.likeService = likeService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<SongResponse> all(@RequestParam(required = false) String search,
                                  @RequestParam(required = false) String q,
                                  @RequestParam(required = false) String query) {
        String term = search != null ? search : (q != null ? q : query);
        return term == null || term.isBlank() ? songService.all() : songService.search(term);
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

    @GetMapping("/energy/{energy}")
    public List<SongResponse> energy(@PathVariable String energy) {
        return songService.byEnergy(energy);
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
        Long userId = SecurityUtils.getUserIdOrNull(authentication, userRepository);
        if (userId == null) {
            return Map.of("songId", songId, "liked", false);
        }
        boolean liked = likeService.isLiked(userId, songId);
        return Map.of("songId", songId, "liked", liked);
    }

    private Long userId(Authentication authentication) {
        return SecurityUtils.getUserId(authentication, userRepository);
    }
}
