package com.vayam.music.repository;

import com.vayam.music.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SongRepository extends JpaRepository<Song, Long> {
    List<Song> findByMoodIgnoreCase(String mood);
    List<Song> findByVibeIgnoreCase(String vibe);
    List<Song> findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCase(String title, String artist);
}
