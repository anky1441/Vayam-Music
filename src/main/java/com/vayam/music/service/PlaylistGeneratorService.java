package com.vayam.music.service;

import com.vayam.music.dto.GeneratePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.dto.ml.MlPlaylistResponse;
import com.vayam.music.dto.ml.MlSongDto;
import com.vayam.music.model.Playlist;
import com.vayam.music.model.PlaylistSong;
import com.vayam.music.model.Song;
import com.vayam.music.repository.PlaylistRepository;
import com.vayam.music.repository.PlaylistSongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class PlaylistGeneratorService {
    private static final Logger log = LoggerFactory.getLogger(PlaylistGeneratorService.class);

    private static final List<String> KNOWN_GENRES = List.of(
            "acoustic", "ambient", "classical", "dance", "electronic",
            "folk", "hip-hop", "indie", "jazz", "lo-fi", "pop", "r&b", "rock", "synthwave"
    );

    private final RecommendationService recommendationService;
    private final PlaylistService playlistService;
    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final UserService userService;
    private final SongService songService;
    private final MlRecommendationClient mlClient;

    public PlaylistGeneratorService(RecommendationService recommendationService,
                                    PlaylistService playlistService,
                                    PlaylistRepository playlistRepository,
                                    PlaylistSongRepository playlistSongRepository,
                                    UserService userService,
                                    SongService songService,
                                    MlRecommendationClient mlClient) {
        this.recommendationService = recommendationService;
        this.playlistService = playlistService;
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.userService = userService;
        this.songService = songService;
        this.mlClient = mlClient;
    }

    public PlaylistResponse generate(Long userId, GeneratePlaylistRequest request) {
        String prompt = request.prompt() == null ? "" : request.prompt().trim();
        List<Song> playlistSongs = new ArrayList<>();

        // Try direct ML Playlist Generation endpoint (/playlist/generate)
        try {
            String mood = mlClient.mapToMlMood(prompt);
            String genre = extractGenre(prompt);
            MlPlaylistResponse mlPlaylist = mlClient.generatePlaylist(mood, 15, genre);

            if (mlPlaylist != null && mlPlaylist.songs() != null && !mlPlaylist.songs().isEmpty()) {
                log.info("ML AI playlist generator produced {} songs for mood '{}', genre '{}'",
                        mlPlaylist.songs().size(), mood, genre);
                for (MlSongDto mlSong : mlPlaylist.songs()) {
                    Song songEntity = recommendationService.findOrCreateSong(mlSong, mood);
                    if (songEntity != null) {
                        playlistSongs.add(songEntity);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Direct ML playlist generation failed, falling back to recommendation engine: {}", e.getMessage());
        }

        // If direct ML playlist generation had no results, use recommendation service
        if (playlistSongs.isEmpty()) {
            List<SongResponse> recommendations = recommendationService.recommend(
                    new com.vayam.music.dto.RecommendationRequest(null, null, prompt)
            );

            if (recommendations.isEmpty()) {
                recommendations = songService.all().stream().limit(10).toList();
            }

            for (SongResponse songResp : recommendations) {
                playlistSongs.add(songService.getEntity(songResp.id()));
            }
        }

        String playlistName = (request.name() == null || request.name().isBlank())
                ? (prompt.isBlank() ? "My Generated Mix" : prompt + " Mix")
                : request.name().trim();

        Playlist playlist = playlistRepository.save(
                new Playlist(playlistName, "AI generated playlist for prompt: " + prompt, userService.getById(userId))
        );

        Set<Long> addedSongIds = new LinkedHashSet<>();
        for (Song song : playlistSongs) {
            if (addedSongIds.add(song.getId())) {
                playlistSongRepository.save(new PlaylistSong(playlist, song));
            }
        }

        return playlistService.get(playlist.getId());
    }

    private String extractGenre(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "";
        }
        String lower = prompt.toLowerCase();
        for (String genre : KNOWN_GENRES) {
            if (lower.contains(genre)) {
                return genre;
            }
        }
        return "";
    }
}
