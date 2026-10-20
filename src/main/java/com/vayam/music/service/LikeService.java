package com.vayam.music.service;

import com.vayam.music.dto.SongResponse;
import com.vayam.music.model.Like;
import com.vayam.music.repository.LikeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LikeService {
    private final LikeRepository likeRepository;
    private final UserService userService;
    private final SongService songService;

    public LikeService(LikeRepository likeRepository, UserService userService, SongService songService) {
        this.likeRepository = likeRepository;
        this.userService = userService;
        this.songService = songService;
    }

    public void like(Long userId, Long songId) {
        if (likeRepository.findByUserIdAndSongId(userId, songId).isEmpty()) {
            likeRepository.save(new Like(userService.getById(userId), songService.getEntity(songId)));
        }
    }

    public void unlike(Long userId, Long songId) {
        likeRepository.findByUserIdAndSongId(userId, songId).ifPresent(likeRepository::delete);
    }

    public List<SongResponse> myLikes(Long userId) {
        return likeRepository.findByUserId(userId).stream()
                .map(like -> SongResponse.from(like.getSong()))
                .toList();
    }
}
