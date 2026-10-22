package com.vayam.music.controller;

import com.vayam.music.dto.GeneratePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.SecurityUtils;
import com.vayam.music.service.PlaylistGeneratorService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/playlists/generate")
public class PlaylistGeneratorController {
    private final PlaylistGeneratorService service;
    private final UserRepository userRepository;

    public PlaylistGeneratorController(PlaylistGeneratorService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping
    public PlaylistResponse generate(@Valid @RequestBody GeneratePlaylistRequest request, Authentication auth) {
        return service.generate(userId(auth), request);
    }

    private Long userId(Authentication auth) {
        return SecurityUtils.getUserId(auth, userRepository);
    }
}
