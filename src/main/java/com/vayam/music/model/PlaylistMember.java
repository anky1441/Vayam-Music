package com.vayam.music.model;

import jakarta.persistence.*;

@Entity
@Table(name = "playlist_members", uniqueConstraints = @UniqueConstraint(columnNames = {"playlist_id", "user_id"}))
public class PlaylistMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "playlist_id")
    private Playlist playlist;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String role;

    public PlaylistMember() {}
    public PlaylistMember(Playlist playlist, User user, String role) {
        this.playlist = playlist;
        this.user = user;
        this.role = role;
    }
    public Long getId() { return id; }
    public Playlist getPlaylist() { return playlist; }
    public User getUser() { return user; }
    public String getRole() { return role; }
}
