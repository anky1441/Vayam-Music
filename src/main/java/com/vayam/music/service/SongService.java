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
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Song not found with id " + id)));
    }

    public List<SongResponse> byMood(String mood) {
        if (mood == null || mood.isBlank()) return List.of();
        String m = mood.trim();
        List<Song> songs = songRepository.findByMoodIgnoreCase(m);
        if (songs.isEmpty()) {
            songs = songRepository.findByMoodContainingIgnoreCase(m);
        }
        return songs.stream().map(SongResponse::from).toList();
    }

    public List<SongResponse> byVibe(String vibe) {
        if (vibe == null || vibe.isBlank()) return List.of();
        String v = vibe.trim();
        List<Song> songs = songRepository.findByVibeIgnoreCase(v);
        if (songs.isEmpty()) {
            songs = songRepository.findByVibeContainingIgnoreCase(v);
        }
        return songs.stream().map(SongResponse::from).toList();
    }

    public List<SongResponse> byGenre(String genre) {
        if (genre == null || genre.isBlank()) return List.of();
        String g = genre.trim();
        List<Song> songs = songRepository.findByGenreIgnoreCase(g);
        if (songs.isEmpty()) {
            songs = songRepository.findByGenreContainingIgnoreCase(g);
        }
        return songs.stream().map(SongResponse::from).toList();
    }

    public List<SongResponse> search(String q) {
        if (q == null || q.isBlank()) return all();
        String query = q.trim();
        return songRepository.findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCaseOrGenreContainingIgnoreCaseOrMoodContainingIgnoreCaseOrVibeContainingIgnoreCase(
                query, query, query, query, query
        ).stream().map(SongResponse::from).toList();
    }

    public Song getEntity(Long id) {
        return songRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Song not found with id " + id));
    }
}
