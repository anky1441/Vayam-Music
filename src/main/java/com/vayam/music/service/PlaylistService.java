package com.vayam.music.service;

import com.vayam.music.dto.CreatePlaylistRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Playlist;
import com.vayam.music.model.PlaylistSong;
import com.vayam.music.repository.PlaylistMemberRepository;
import com.vayam.music.repository.PlaylistRepository;
import com.vayam.music.repository.PlaylistSongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional
public class PlaylistService {
    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final PlaylistMemberRepository playlistMemberRepository;
    private final UserService userService;
    private final SongService songService;

    public PlaylistService(PlaylistRepository playlistRepository,
                           PlaylistSongRepository playlistSongRepository,
                           PlaylistMemberRepository playlistMemberRepository,
                           UserService userService,
                           SongService songService) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.playlistMemberRepository = playlistMemberRepository;
        this.userService = userService;
        this.songService = songService;
    }

    public PlaylistResponse create(Long userId, CreatePlaylistRequest request) {
        Playlist playlist = playlistRepository.save(
                new Playlist(request.name().trim(), request.description(), userService.getById(userId))
        );
        return toResponse(playlist);
    }

    public List<PlaylistResponse> myPlaylists(Long userId) {
        return playlistRepository.findByOwnerId(userId).stream().map(this::toResponse).toList();
    }

    public PlaylistResponse get(Long id) {
        return toResponse(getEntity(id));
    }

    public void addSong(Long userId, Long playlistId, Long songId) {
        Playlist playlist = getEntity(playlistId);
        checkOwner(userId, playlist);
        if (playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId).isEmpty()) {
            playlistSongRepository.save(new PlaylistSong(playlist, songService.getEntity(songId)));
        }
    }

    public void removeSong(Long userId, Long playlistId, Long songId) {
        Playlist playlist = getEntity(playlistId);
        checkOwner(userId, playlist);
        playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId)
                .ifPresent(playlistSongRepository::delete);
    }

    @Transactional
    public void delete(Long userId, Long playlistId) {
        Playlist playlist = getEntity(playlistId);
        checkOwner(userId, playlist);
        playlistSongRepository.deleteAll(playlistSongRepository.findByPlaylistId(playlistId));
        playlistMemberRepository.deleteAll(playlistMemberRepository.findByPlaylistId(playlistId));
        playlistRepository.delete(playlist);
    }

    public Playlist getEntity(Long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Playlist not found with id " + id));
    }

    private void checkOwner(Long userId, Playlist playlist) {
        if (!playlist.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(FORBIDDEN, "Only the playlist owner can perform this action");
        }
    }

    public PlaylistResponse toResponse(Playlist playlist) {
        List<SongResponse> songs = playlistSongRepository.findByPlaylistId(playlist.getId())
                .stream().map(x -> SongResponse.from(x.getSong())).toList();
        return new PlaylistResponse(playlist.getId(), playlist.getName(), playlist.getDescription(),
                playlist.getOwner().getId(), songs);
    }
}
