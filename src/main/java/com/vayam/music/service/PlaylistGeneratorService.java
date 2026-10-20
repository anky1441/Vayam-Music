package com.vayam.music.service;

import com.vayam.music.dto.GeneratePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Playlist;
import com.vayam.music.model.PlaylistSong;
import com.vayam.music.repository.PlaylistRepository;
import com.vayam.music.repository.PlaylistSongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PlaylistGeneratorService {
    private final RecommendationService recommendationService;
    private final PlaylistService playlistService;
    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final UserService userService;
    private final SongService songService;

    public PlaylistGeneratorService(RecommendationService recommendationService, PlaylistService playlistService,
                                    PlaylistRepository playlistRepository, PlaylistSongRepository playlistSongRepository,
                                    UserService userService, SongService songService) {
        this.recommendationService = recommendationService;
        this.playlistService = playlistService;
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.userService = userService;
        this.songService = songService;
    }

    public PlaylistResponse generate(Long userId, GeneratePlaylistRequest request) {
        String prompt = request.prompt() == null ? "" : request.prompt().trim();
        List<SongResponse> recommendations = recommendationService.recommend(
                new com.vayam.music.dto.RecommendationRequest(null, null, prompt)
        );

        if (recommendations.isEmpty()) {
            recommendations = songService.all().stream().limit(10).toList();
        }

        String playlistName = (request.name() == null || request.name().isBlank())
                ? (prompt.isBlank() ? "My Generated Mix" : prompt + " Mix")
                : request.name().trim();

        Playlist playlist = playlistRepository.save(
                new Playlist(playlistName, "AI generated playlist for prompt: " + prompt, userService.getById(userId))
        );

        for (SongResponse song : recommendations) {
            playlistSongRepository.save(new PlaylistSong(playlist, songService.getEntity(song.id())));
        }

        return playlistService.get(playlist.getId());
    }
}
