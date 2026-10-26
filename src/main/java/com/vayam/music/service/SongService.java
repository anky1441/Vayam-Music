package com.vayam.music.service;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Song;
import com.vayam.music.repository.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
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

    public List<SongResponse> byEnergy(String energy) {
        if (energy == null || energy.isBlank()) return List.of();
        String e = energy.trim();
        List<Song> songs = songRepository.findByEnergyIgnoreCase(e);
        if (songs.isEmpty()) {
            songs = songRepository.findByEnergyContainingIgnoreCase(e);
        }
        return songs.stream().map(SongResponse::from).toList();
    }

    public List<SongResponse> search(String q) {
        if (q == null || q.isBlank()) return all();
        String query = q.trim();
        return songRepository.findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCaseOrGenreContainingIgnoreCaseOrMoodContainingIgnoreCaseOrVibeContainingIgnoreCaseOrEnergyContainingIgnoreCase(
                query, query, query, query, query, query
        ).stream().map(SongResponse::from).toList();
    }

    public Song getEntity(Long id) {
        return songRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Song not found with id " + id));
    }

    @Transactional
    public SongResponse create(com.vayam.music.dto.CreateSongRequest req) {
        Song song = new Song(
                req.title().trim(),
                req.artist().trim(),
                req.genre() != null && !req.genre().isBlank() ? req.genre().trim() : "Bollywood",
                req.mood() != null && !req.mood().isBlank() ? req.mood().trim() : "Chill",
                req.energy() != null && !req.energy().isBlank() ? req.energy().trim() : "Medium",
                req.vibe() != null && !req.vibe().isBlank() ? req.vibe().trim() : "Good Vibes",
                req.audioUrl(),
                req.coverUrl()
        );
        return SongResponse.from(songRepository.save(song));
    }

    @Transactional
    public SongResponse update(Long id, com.vayam.music.dto.CreateSongRequest req) {
        Song song = getEntity(id);
        if (req.title() != null && !req.title().isBlank()) song.setTitle(req.title().trim());
        if (req.artist() != null && !req.artist().isBlank()) song.setArtist(req.artist().trim());
        if (req.genre() != null) song.setGenre(req.genre().trim());
        if (req.mood() != null) song.setMood(req.mood().trim());
        if (req.energy() != null) song.setEnergy(req.energy().trim());
        if (req.vibe() != null) song.setVibe(req.vibe().trim());
        if (req.audioUrl() != null) song.setAudioUrl(req.audioUrl().trim());
        if (req.coverUrl() != null) song.setCoverUrl(req.coverUrl().trim());
        return SongResponse.from(songRepository.save(song));
    }
}

