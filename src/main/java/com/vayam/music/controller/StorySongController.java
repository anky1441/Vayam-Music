package com.vayam.music.controller;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.dto.StorySongRequest;
import com.vayam.music.service.StorySongService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
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

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public List<SongResponse> match(@RequestParam("vibe") String vibe,
                                    @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return storySongService.matchVibe(vibe);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public List<SongResponse> matchDirectJson(@Valid @RequestBody StorySongRequest request) {
        return storySongService.matchVibe(request.vibe());
    }

    @PostMapping(value = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    public List<SongResponse> matchJson(@Valid @RequestBody StorySongRequest request) {
        return storySongService.matchVibe(request.vibe());
    }

    @GetMapping
    public List<SongResponse> matchGet(@RequestParam(value = "vibe", required = false) String vibe) {
        return storySongService.matchVibe(vibe);
    }
}
