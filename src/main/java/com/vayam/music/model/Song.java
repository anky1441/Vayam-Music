package com.vayam.music.model;

import jakarta.persistence.*;

@Entity
@Table(name = "songs")
public class Song {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artist;

    private String genre;
    private String mood;
    private String energy;
    private String vibe;
    private String audioUrl;
    private String coverUrl;

    public Song() {}

    public Song(String title, String artist, String genre, String mood, String energy, String vibe, String audioUrl, String coverUrl) {
        this.title = title;
        this.artist = artist;
        this.genre = genre;
        this.mood = mood;
        this.energy = energy;
        this.vibe = vibe;
        this.audioUrl = audioUrl;
        this.coverUrl = coverUrl;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getArtist() { return artist; }
    public String getGenre() { return genre; }
    public String getMood() { return mood; }
    public String getEnergy() { return energy; }
    public String getVibe() { return vibe; }
    public String getAudioUrl() { return audioUrl; }
    public String getCoverUrl() { return coverUrl; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setArtist(String artist) { this.artist = artist; }
    public void setGenre(String genre) { this.genre = genre; }
    public void setMood(String mood) { this.mood = mood; }
    public void setEnergy(String energy) { this.energy = energy; }
    public void setVibe(String vibe) { this.vibe = vibe; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
}
