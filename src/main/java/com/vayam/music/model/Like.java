package com.vayam.music.model;

import jakarta.persistence.*;

@Entity
@Table(name = "song_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "song_id"}))
public class Like {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "song_id")
    private Song song;

    public Like() {}
    public Like(User user, Song song) { this.user = user; this.song = song; }
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Song getSong() { return song; }
}
