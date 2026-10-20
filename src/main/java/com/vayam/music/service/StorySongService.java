package com.vayam.music.service;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Song;
import com.vayam.music.repository.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
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
            songs = songRepository.findByGenreContainingIgnoreCase(query);
        }
        if (songs.isEmpty()) {
            // Token-based matching fallback for multi-word queries like "late night vibes"
            String[] tokens = query.toLowerCase().split("\\s+");
            List<Song> allSongs = songRepository.findAll();
            songs = allSongs.stream()
                    .filter(s -> {
                        String combined = ((s.getVibe() != null ? s.getVibe() : "") + " "
                                + (s.getMood() != null ? s.getMood() : "") + " "
                                + (s.getGenre() != null ? s.getGenre() : "") + " "
                                + (s.getEnergy() != null ? s.getEnergy() : "") + " "
                                + (s.getTitle() != null ? s.getTitle() : "")).toLowerCase();
                        for (String t : tokens) {
                            if (t.length() > 2 && combined.contains(t)) {
                                return true;
                            }
                        }
                        return false;
                    })
                    .toList();
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
