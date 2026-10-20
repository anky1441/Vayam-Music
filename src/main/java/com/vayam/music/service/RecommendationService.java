package com.vayam.music.service;

import com.vayam.music.dto.RecommendationRequest;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Song;
import com.vayam.music.repository.SongRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class RecommendationService {
    private final SongRepository songRepository;

    public RecommendationService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    /**
     * Hybrid recommendation engine supporting mood, prompt keywords, and similarity to a liked song.
     */
    public List<SongResponse> recommend(RecommendationRequest request) {
        List<Song> allSongs = songRepository.findAll();
        if (allSongs.isEmpty()) {
            return List.of();
        }

        if (request == null) {
            return allSongs.stream().limit(10).map(SongResponse::from).toList();
        }

        String mood = request.mood() == null ? "" : request.mood().trim().toLowerCase();
        String prompt = request.prompt() == null ? "" : request.prompt().trim().toLowerCase();
        Long likedSongId = request.likedSongId();

        Song likedSong = null;
        if (likedSongId != null) {
            likedSong = songRepository.findById(likedSongId).orElse(null);
        }

        final Song referenceSong = likedSong;
        List<ScoredSong> scored = allSongs.stream()
                .filter(s -> referenceSong == null || !s.getId().equals(referenceSong.getId()))
                .map(song -> new ScoredSong(song, score(song, mood, prompt, referenceSong)))
                .filter(x -> x.score() > 0)
                .sorted(Comparator.comparingInt(ScoredSong::score).reversed())
                .limit(10)
                .toList();

        // If no songs matched the filters, return top 10 general songs as fallback
        if (scored.isEmpty()) {
            return allSongs.stream()
                    .filter(s -> referenceSong == null || !s.getId().equals(referenceSong.getId()))
                    .limit(10)
                    .map(SongResponse::from)
                    .toList();
        }

        return scored.stream().map(x -> SongResponse.from(x.song())).toList();
    }

    private int score(Song song, String mood, String prompt, Song referenceSong) {
        int score = 0;

        // Score based on mood
        if (!mood.isBlank()) {
            String sMood = song.getMood() == null ? "" : song.getMood().toLowerCase();
            if (sMood.equalsIgnoreCase(mood)) {
                score += 6;
            } else if (sMood.contains(mood) || mood.contains(sMood)) {
                score += 3;
            }
        }

        // Score based on prompt
        if (!prompt.isBlank()) {
            String sTitle = song.getTitle() == null ? "" : song.getTitle().toLowerCase();
            String sArtist = song.getArtist() == null ? "" : song.getArtist().toLowerCase();
            String sGenre = song.getGenre() == null ? "" : song.getGenre().toLowerCase();
            String sMood = song.getMood() == null ? "" : song.getMood().toLowerCase();
            String sVibe = song.getVibe() == null ? "" : song.getVibe().toLowerCase();

            // Full prompt match
            if (sVibe.contains(prompt)) score += 6;
            if (sMood.contains(prompt)) score += 5;
            if (sGenre.contains(prompt)) score += 4;
            if (sTitle.contains(prompt)) score += 4;
            if (sArtist.contains(prompt)) score += 4;

            // Tokenized prompt match
            String[] tokens = prompt.split("\\s+");
            for (String token : tokens) {
                if (token.length() > 2) {
                    if (sVibe.contains(token)) score += 3;
                    if (sMood.contains(token)) score += 3;
                    if (sGenre.contains(token)) score += 2;
                    if (sArtist.contains(token)) score += 2;
                    if (sTitle.contains(token)) score += 2;
                }
            }
        }

        // Score based on similarity to liked reference song
        if (referenceSong != null) {
            if (referenceSong.getArtist() != null && referenceSong.getArtist().equalsIgnoreCase(song.getArtist())) {
                score += 5;
            }
            if (referenceSong.getGenre() != null && referenceSong.getGenre().equalsIgnoreCase(song.getGenre())) {
                score += 4;
            }
            if (referenceSong.getMood() != null && referenceSong.getMood().equalsIgnoreCase(song.getMood())) {
                score += 3;
            }
            if (referenceSong.getVibe() != null && referenceSong.getVibe().equalsIgnoreCase(song.getVibe())) {
                score += 3;
            }
        }

        return score;
    }

    private record ScoredSong(Song song, int score) {}
}
