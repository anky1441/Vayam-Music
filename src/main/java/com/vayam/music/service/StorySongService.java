package com.vayam.music.service;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.repository.SongRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StorySongService {
    private final SongRepository songRepository;

    public StorySongService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    public List<SongResponse> matchVibe(String vibe) {
        return songRepository.findByVibeIgnoreCase(vibe).stream()
                .map(SongResponse::from)
                .limit(5)
                .toList();
    }
}
