package com.vayam.music.service;

import com.vayam.music.dto.AddMemberRequest;
import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.UserResponse;
import com.vayam.music.model.Playlist;
import com.vayam.music.model.PlaylistMember;
import com.vayam.music.model.PlaylistSong;
import com.vayam.music.repository.PlaylistMemberRepository;
import com.vayam.music.repository.PlaylistSongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
@Transactional
public class CollaborativePlaylistService {
    private final PlaylistMemberRepository memberRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final PlaylistService playlistService;
    private final UserService userService;
    private final SongService songService;

    public CollaborativePlaylistService(PlaylistMemberRepository memberRepository,
                                        PlaylistSongRepository playlistSongRepository,
                                        PlaylistService playlistService, UserService userService,
                                        SongService songService) {
        this.memberRepository = memberRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.playlistService = playlistService;
        this.userService = userService;
        this.songService = songService;
    }

    public void addMember(Long requesterId, Long playlistId, AddMemberRequest request) {
        Playlist playlist = playlistService.getEntity(playlistId);
        checkOwner(requesterId, playlist);

        if (playlist.getOwner().getId().equals(request.userId())) return;
        if (memberRepository.findByPlaylistIdAndUserId(playlistId, request.userId()).isEmpty()) {
            memberRepository.save(new PlaylistMember(playlist, userService.getById(request.userId()), "MEMBER"));
        }
    }

    public void removeMember(Long requesterId, Long playlistId, Long targetUserId) {
        Playlist playlist = playlistService.getEntity(playlistId);
        if (!playlist.getOwner().getId().equals(requesterId) && !requesterId.equals(targetUserId)) {
            throw new ResponseStatusException(FORBIDDEN, "Only the owner or the member themselves can perform this action");
        }
        memberRepository.findByPlaylistIdAndUserId(playlistId, targetUserId).ifPresent(memberRepository::delete);
    }

    public List<UserResponse> getMembers(Long requesterId, Long playlistId) {
        if (!canEdit(requesterId, playlistId)) {
            throw new ResponseStatusException(FORBIDDEN, "You do not have access to this shared playlist");
        }
        return memberRepository.findByPlaylistId(playlistId).stream()
                .map(m -> UserResponse.from(m.getUser()))
                .toList();
    }

    public List<PlaylistResponse> getSharedWithMe(Long userId) {
        List<PlaylistMember> memberships = memberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> playlistService.toResponse(m.getPlaylist()))
                .toList();
    }

    public void addSong(Long userId, Long playlistId, Long songId) {
        if (!canEdit(userId, playlistId)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not a member of this shared playlist");
        }
        Playlist playlist = playlistService.getEntity(playlistId);
        if (playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId).isEmpty()) {
            playlistSongRepository.save(new PlaylistSong(playlist, songService.getEntity(songId)));
        }
    }

    public void removeSong(Long userId, Long playlistId, Long songId) {
        if (!canEdit(userId, playlistId)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not a member of this shared playlist");
        }
        playlistSongRepository.findByPlaylistIdAndSongId(playlistId, songId).ifPresent(playlistSongRepository::delete);
    }

    public boolean canEdit(Long userId, Long playlistId) {
        Playlist playlist = playlistService.getEntity(playlistId);
        return playlist.getOwner().getId().equals(userId)
                || memberRepository.findByPlaylistIdAndUserId(playlistId, userId).isPresent();
    }

    private void checkOwner(Long userId, Playlist playlist) {
        if (!playlist.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(FORBIDDEN, "Only the playlist owner can manage members");
        }
    }
}
