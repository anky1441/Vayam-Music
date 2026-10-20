package com.vayam.music.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping({"/", "/api", "/api/health"})
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "Music Streaming API",
                "version", "0.0.1-SNAPSHOT",
                "message", "Music backend application is running successfully"
        );
    }
}
