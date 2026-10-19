package com.vayam.music.service;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Song;
import com.vayam.music.repository.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class SongService {
    private final SongRepository songRepository;

    public SongService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    public List<SongResponse> all() {
        return songRepository.findAll().stream().map(SongResponse::from).toList();
    }

    public SongResponse get(Long id) {
        return SongResponse.from(songRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Song not found")));
    }

    public List<SongResponse> byMood(String mood) {
        return songRepository.findByMoodIgnoreCase(mood).stream().map(SongResponse::from).toList();
    }

    public List<SongResponse> byVibe(String vibe) {
        return songRepository.findByVibeIgnoreCase(vibe).stream().map(SongResponse::from).toList();
    }

    public List<SongResponse> search(String q) {
        return songRepository.findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCase(q, q)
                .stream().map(SongResponse::from).toList();
    }

    public Song getEntity(Long id) {
        return songRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Song not found"));
    }
}
