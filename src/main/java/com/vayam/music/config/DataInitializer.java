package com.vayam.music.config;

import com.vayam.music.model.Playlist;
import com.vayam.music.model.PlaylistSong;
import com.vayam.music.model.Song;
import com.vayam.music.model.User;
import com.vayam.music.repository.PlaylistRepository;
import com.vayam.music.repository.PlaylistSongRepository;
import com.vayam.music.repository.SongRepository;
import com.vayam.music.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(SongRepository songRepository,
                           UserRepository userRepository,
                           PlaylistRepository playlistRepository,
                           PlaylistSongRepository playlistSongRepository,
                           PasswordEncoder passwordEncoder) {
        this.songRepository = songRepository;
        this.userRepository = userRepository;
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Seed users if missing
        User demoUser = userRepository.findByEmailIgnoreCase("demo@example.com").orElse(null);
        if (demoUser == null) {
            demoUser = userRepository.save(new User("Demo User", "demo@example.com", passwordEncoder.encode("password123")));
        }
        if (!userRepository.existsByEmailIgnoreCase("alice@example.com")) {
            userRepository.save(new User("Alice Smith", "alice@example.com", passwordEncoder.encode("password123")));
        }
        if (!userRepository.existsByEmailIgnoreCase("bob@example.com")) {
            userRepository.save(new User("Bob Jones", "bob@example.com", passwordEncoder.encode("password123")));
        }

        // Seed songs if empty
        if (songRepository.count() == 0) {
            List<Song> songs = List.of(
                    new Song("Midnight City Lights", "Luna Wave", "Electronic", "Energetic", "High", "Night Drive",
                            "",
                            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"),
                    new Song("Sunset Acoustic Reverie", "The Wanderers", "Indie Folk", "Chill", "Low", "Acoustic Sunset",
                            "",
                            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"),
                    new Song("Coffee & Lo-Fi Beats", "Chilled Panda", "Lo-Fi", "Focus", "Low", "Study Cafe",
                            "",
                            "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500"),
                    new Song("Festival Euphoria", "Pulse Riders", "Dance / Pop", "Happy", "High", "Party Club",
                            "",
                            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500"),
                    new Song("Rainy Day Memories", "Echo Piano", "Classical / Ambient", "Sad", "Low", "Rainy Window",
                            "",
                            "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=500"),
                    new Song("Neon Dreams", "Synth Voyager", "Synthwave", "Energetic", "High", "Retro Arcade",
                            "",
                            "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500"),
                    new Song("Starlight Serenade", "Velvet Harmony", "R&B / Soul", "Romantic", "Medium", "Candlelight",
                            "",
                            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"),
                    new Song("Deep Focus Horizon", "Neural Mind", "Ambient", "Focus", "Low", "Deep Coding",
                            "",
                            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"),
                    new Song("Morning Sunshine", "The Brightside", "Pop", "Happy", "Medium", "Feel Good",
                            "",
                            "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500"),
                    new Song("Adrenaline Rush", "Apex Velocity", "Rock", "Energetic", "High", "Workout Gym",
                            "",
                            "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=500")
            );
            songRepository.saveAll(songs);
        }

        // Create initial playlist for demoUser if they have none
        if (demoUser != null && playlistRepository.findByOwnerId(demoUser.getId()).isEmpty()) {
            List<Song> currentSongs = songRepository.findAll();
            if (currentSongs.size() >= 3) {
                Playlist demoPlaylist = playlistRepository.save(
                        new Playlist("Chill & Focus Hits", "Hand-picked relaxing tunes for work and study", demoUser)
                );
                playlistSongRepository.save(new PlaylistSong(demoPlaylist, currentSongs.get(1)));
                playlistSongRepository.save(new PlaylistSong(demoPlaylist, currentSongs.get(2)));
                playlistSongRepository.save(new PlaylistSong(demoPlaylist, currentSongs.get(Math.min(7, currentSongs.size() - 1))));
            }
        }
    }
}
