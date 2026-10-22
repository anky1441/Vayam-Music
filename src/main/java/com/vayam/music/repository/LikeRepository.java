package com.vayam.music.repository;

import com.vayam.music.model.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    List<Like> findByUserId(Long userId);
    Optional<Like> findByUserIdAndSongId(Long userId, Long songId);
}
