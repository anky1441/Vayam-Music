package com.vayam.music.service;

import com.vayam.music.dto.RecommendationRequest;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Song;
import com.vayam.music.repository.SongRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {
    private final SongRepository songRepository;

    public RecommendationService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    /**
     * Baseline recommendation logic for the first demo.
     * ML Person 1 can replace this method with a call to the Python ML service.
     */
    public List<SongResponse> recommend(RecommendationRequest request) {
        List<Song> songs = songRepository.findAll();
        String mood = request.mood() == null ? "" : request.mood().trim().toLowerCase();
        String prompt = request.prompt() == null ? "" : request.prompt().trim().toLowerCase();

        return songs.stream()
                .map(song -> new ScoredSong(song, score(song, mood, prompt)))
                .filter(x -> x.score() > 0)
                .sorted(Comparator.comparingInt(ScoredSong::score).reversed())
                .limit(10)
                .map(x -> SongResponse.from(x.song()))
                .toList();
    }

    private int score(Song song, String mood, String prompt) {
        int score = 0;
        if (!mood.isBlank() && song.getMood() != null && song.getMood().equalsIgnoreCase(mood)) score += 5;
        if (!prompt.isBlank()) {
            if (song.getVibe() != null && song.getVibe().toLowerCase().contains(prompt)) score += 3;
            if (song.getGenre() != null && song.getGenre().toLowerCase().contains(prompt)) score += 2;
            if (song.getMood() != null && song.getMood().toLowerCase().contains(prompt)) score += 2;
        }
        return score;
    }

    private record ScoredSong(Song song, int score) {}
}
