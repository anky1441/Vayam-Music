package com.vayam.music.service;

import com.vayam.music.dto.RecommendationRequest;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.dto.ml.MlSongDto;
import com.vayam.music.model.Song;
import com.vayam.music.repository.SongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class RecommendationService {
    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    private final SongRepository songRepository;
    private final MlRecommendationClient mlClient;

    public RecommendationService(SongRepository songRepository, MlRecommendationClient mlClient) {
        this.songRepository = songRepository;
        this.mlClient = mlClient;
    }

    /**
     * AI/ML Recommendation engine with intelligent rule-based fallback.
     * Queries the FastAPI ML model microservice first; if unreachable, cold-starting,
     * or no matches are found, gracefully falls back to database scoring.
     */
    public List<SongResponse> recommend(RecommendationRequest request) {
        // Step 1: Attempt recommendation via ML microservice
        try {
            List<MlSongDto> mlSongs = queryMlModel(request);
            if (mlSongs != null && !mlSongs.isEmpty()) {
                String defaultMood = request != null && request.mood() != null ? request.mood() : "Chill";
                List<SongResponse> mlResults = new ArrayList<>();
                for (MlSongDto mlSong : mlSongs) {
                    Song entity = findOrCreateSong(mlSong, defaultMood);
                    if (entity != null) {
                        mlResults.add(SongResponse.from(entity));
                    }
                }
                if (!mlResults.isEmpty()) {
                    log.info("Returning {} ML-powered song recommendations", mlResults.size());
                    return mlResults;
                }
            }
        } catch (Exception e) {
            log.warn("ML model query failed, activating hybrid database fallback: {}", e.getMessage());
        }

        // Step 2: Fallback to internal rule-based scoring engine
        return fallbackRecommend(request);
    }

    private List<MlSongDto> queryMlModel(RecommendationRequest request) {
        if (request == null) {
            return Collections.emptyList();
        }

        // 1. Liked song similarity via ML content model
        if (request.likedSongId() != null) {
            Song liked = songRepository.findById(request.likedSongId()).orElse(null);
            if (liked != null && liked.getTitle() != null && !liked.getTitle().isBlank()) {
                List<MlSongDto> similar = mlClient.recommendSimilar(liked.getTitle(), 10);
                if (!similar.isEmpty()) {
                    return similar;
                }
            }
        }

        // 2. Explicit Mood recommendation via ML model
        if (request.mood() != null && !request.mood().isBlank()) {
            List<MlSongDto> byMood = mlClient.recommendByMood(request.mood(), 10);
            if (!byMood.isEmpty()) {
                return byMood;
            }
        }

        // 3. Prompt recommendation
        if (request.prompt() != null && !request.prompt().isBlank()) {
            String prompt = request.prompt().trim();
            // Try matching as mood first
            String mappedMood = mlClient.mapToMlMood(prompt);
            List<MlSongDto> promptMood = mlClient.recommendByMood(mappedMood, 10);
            if (!promptMood.isEmpty()) {
                return promptMood;
            }

            // Or try matching similar by prompt title
            List<MlSongDto> promptSimilar = mlClient.recommendSimilar(prompt, 10);
            if (!promptSimilar.isEmpty()) {
                return promptSimilar;
            }
        }

        return Collections.emptyList();
    }

    public Song findOrCreateSong(MlSongDto dto, String fallbackMood) {
        if (dto == null || dto.trackName() == null || dto.trackName().isBlank()) {
            return null;
        }

        String title = dto.trackName().trim();
        String artist = (dto.artists() != null && !dto.artists().isBlank()) ? dto.artists().trim() : "Various Artists";
        String genre = (dto.trackGenre() != null && !dto.trackGenre().isBlank()) ? dto.trackGenre().trim() : "Pop";

        return songRepository.findFirstByTitleIgnoreCaseAndArtistIgnoreCase(title, artist)
                .or(() -> songRepository.findFirstByTitleIgnoreCase(title))
                .orElseGet(() -> {
                    String audioUrl = "https://actions.google.com/sounds/v1/science_fiction/alien_spaceship_flyby.ogg";
                    String coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500";
                    Song song = new Song(
                            title,
                            artist,
                            genre,
                            fallbackMood != null ? fallbackMood : "Chill",
                            "Medium",
                            genre,
                            audioUrl,
                            coverUrl
                    );
                    return songRepository.save(song);
                });
    }

    /**
     * Fallback recommendation engine using database matching and scoring.
     */
    public List<SongResponse> fallbackRecommend(RecommendationRequest request) {
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
            String sVibe = song.getVibe() == null ? "" : song.getVibe().toLowerCase();
            String sGenre = song.getGenre() == null ? "" : song.getGenre().toLowerCase();
            if (sMood.equalsIgnoreCase(mood)) {
                score += 6;
            } else if (sMood.contains(mood) || mood.contains(sMood)) {
                score += 3;
            } else if (sVibe.contains(mood) || sGenre.contains(mood)) {
                score += 2;
            }
        }

        // Score based on prompt
        if (!prompt.isBlank()) {
            String sTitle = song.getTitle() == null ? "" : song.getTitle().toLowerCase();
            String sArtist = song.getArtist() == null ? "" : song.getArtist().toLowerCase();
            String sGenre = song.getGenre() == null ? "" : song.getGenre().toLowerCase();
            String sMood = song.getMood() == null ? "" : song.getMood().toLowerCase();
            String sVibe = song.getVibe() == null ? "" : song.getVibe().toLowerCase();
            String sEnergy = song.getEnergy() == null ? "" : song.getEnergy().toLowerCase();

            // Full prompt match
            if (sVibe.contains(prompt)) score += 6;
            if (sMood.contains(prompt)) score += 5;
            if (sGenre.contains(prompt)) score += 4;
            if (sEnergy.contains(prompt)) score += 4;
            if (sTitle.contains(prompt)) score += 4;
            if (sArtist.contains(prompt)) score += 4;

            // Tokenized prompt match
            String[] tokens = prompt.split("\\s+");
            for (String token : tokens) {
                if (token.length() > 2) {
                    if (sVibe.contains(token)) score += 3;
                    if (sMood.contains(token)) score += 3;
                    if (sGenre.contains(token)) score += 2;
                    if (sEnergy.contains(token)) score += 2;
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
            if (referenceSong.getEnergy() != null && referenceSong.getEnergy().equalsIgnoreCase(song.getEnergy())) {
                score += 2;
            }
        }

        return score;
    }

    private record ScoredSong(Song song, int score) {}
}
