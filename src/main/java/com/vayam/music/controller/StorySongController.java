package com.vayam.music.controller;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.dto.StorySongRequest;
import com.vayam.music.service.StorySongService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/storysong")
public class StorySongController {
    private final StorySongService storySongService;

    public StorySongController(StorySongService storySongService) {
        this.storySongService = storySongService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public List<SongResponse> match(@RequestPart("vibe") String vibe,
                                    @RequestPart(value = "photo", required = false) MultipartFile photo) {
        // First version: the selected vibe drives matching. The photo is accepted for the UI flow
        // but is not permanently stored; image understanding can be connected later by the ML team.
        return storySongService.matchVibe(vibe);
    }

    @PostMapping("/json")
    public List<SongResponse> matchJson(@Valid @RequestBody StorySongRequest request) {
        return storySongService.matchVibe(request.vibe());
    }
}
