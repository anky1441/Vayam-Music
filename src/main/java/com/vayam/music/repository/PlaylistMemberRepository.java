package com.vayam.music.repository;

import com.vayam.music.model.PlaylistMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlaylistMemberRepository extends JpaRepository<PlaylistMember, Long> {
    List<PlaylistMember> findByPlaylistId(Long playlistId);
    Optional<PlaylistMember> findByPlaylistIdAndUserId(Long playlistId, Long userId);
}
