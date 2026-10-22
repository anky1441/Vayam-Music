package com.vayam.music.repository;

import com.vayam.music.model.PlaylistSong;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, Long> {
    List<PlaylistSong> findByPlaylistId(Long playlistId);
    Optional<PlaylistSong> findByPlaylistIdAndSongId(Long playlistId, Long songId);
}
