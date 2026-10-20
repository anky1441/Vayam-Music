package com.vayam.music.service;

import com.vayam.music.dto.CreatePlaylistRequest;
import com.vayam.music.dto.GeneratePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Playlist;
import com.vayam.music.repository.PlaylistRepository;
import com.vayam.music.repository.PlaylistSongRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
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
        List<SongResponse> recommendations = recommendationService.recommend(
                new com.vayam.music.dto.RecommendationRequest(null, null, request.prompt())
        );

        String playlistName = (request.name() == null || request.name().isBlank())
                ? request.prompt() + " Playlist" : request.name();

        Playlist playlist = playlistRepository.save(
                new Playlist(playlistName, "Generated from: " + request.prompt(), userService.getById(userId))
        );

        for (SongResponse song : recommendations) {
            playlistSongRepository.save(new com.vayam.music.model.PlaylistSong(playlist, songService.getEntity(song.id())));
        }

        return playlistService.get(playlist.getId());
    }
}
