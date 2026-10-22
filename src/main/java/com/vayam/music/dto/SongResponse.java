package com.vayam.music.dto;

import com.vayam.music.model.Song;

public record SongResponse(Long id, String title, String artist, String genre, String mood,
                           String energy, String vibe, String audioUrl, String coverUrl) {
    public static SongResponse from(Song s) {
        return new SongResponse(s.getId(), s.getTitle(), s.getArtist(), s.getGenre(), s.getMood(),
                s.getEnergy(), s.getVibe(), s.getAudioUrl(), s.getCoverUrl());
    }
}
