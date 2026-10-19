package com.vayam.music.model;

import jakarta.persistence.*;

@Entity
@Table(name = "playlist_songs", uniqueConstraints = @UniqueConstraint(columnNames = {"playlist_id", "song_id"}))
public class PlaylistSong {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id")
    private Playlist playlist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "song_id")
    private Song song;

    public PlaylistSong() {}
    public PlaylistSong(Playlist playlist, Song song) {
        this.playlist = playlist;
        this.song = song;
    }
    public Long getId() { return id; }
    public Playlist getPlaylist() { return playlist; }
    public Song getSong() { return song; }
}
