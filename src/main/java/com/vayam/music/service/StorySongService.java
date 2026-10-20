package com.vayam.music.service;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Song;
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
        if (vibe == null || vibe.isBlank()) {
            return songRepository.findAll().stream().limit(5).map(SongResponse::from).toList();
        }

        String query = vibe.trim();
        List<Song> songs = songRepository.findByVibeIgnoreCase(query);
        if (songs.isEmpty()) {
            songs = songRepository.findByVibeContainingIgnoreCase(query);
        }
        if (songs.isEmpty()) {
            songs = songRepository.findByMoodIgnoreCase(query);
        }
        if (songs.isEmpty()) {
            songs = songRepository.findByMoodContainingIgnoreCase(query);
        }
        if (songs.isEmpty()) {
            songs = songRepository.findAll();
        }

        return songs.stream()
                .map(SongResponse::from)
                .limit(5)
                .toList();
    }
}
