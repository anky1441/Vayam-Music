package com.vayam.music.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

<<<<<<< HEAD
    @Column
    private String provider = "LOCAL";

    @Column
    private String avatarUrl;

    @Column
    private String googleId;

=======
>>>>>>> aa469ed8f3ae6a2a739ff58d10e3bf3b74f1cb83
    public User() {}

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
<<<<<<< HEAD
        this.provider = "LOCAL";
    }

    public User(String name, String email, String password, String provider, String avatarUrl, String googleId) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.provider = provider != null ? provider : "LOCAL";
        this.avatarUrl = avatarUrl;
        this.googleId = googleId;
=======
>>>>>>> aa469ed8f3ae6a2a739ff58d10e3bf3b74f1cb83
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
<<<<<<< HEAD
    public String getProvider() { return provider; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getGoogleId() { return googleId; }

=======
>>>>>>> aa469ed8f3ae6a2a739ff58d10e3bf3b74f1cb83
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
<<<<<<< HEAD
    public void setProvider(String provider) { this.provider = provider; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
=======
>>>>>>> aa469ed8f3ae6a2a739ff58d10e3bf3b74f1cb83
}
