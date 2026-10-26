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
        // Seed demo users if missing
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

        // Curated song library with audio streaming URLs and album cover artwork
        List<Song> songsToSeed = List.of(
                // ==================== Happy & Uplifting ====================
                new Song("Tum Hi Ho Bandhu", "Neeraj Shridhar, Kavita Seth", "Bollywood Pop", "Happy", "High", "Uplifting",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"),
                new Song("Pal", "Arijit Singh, Shreya Ghoshal", "Bollywood Acoustic", "Happy", "Medium", "Uplifting",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500"),
                new Song("Sooraj Dooba Hain", "Arijit Singh, Aditi Singh Sharma", "Dance / Electronic", "Happy", "High", "Uplifting",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500"),
                new Song("Ilahi", "Arijit Singh", "Indie Folk", "Happy", "High", "Uplifting",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"),
                new Song("Mast Magan", "Arijit Singh, Chinmayi Sripada", "Romantic", "Happy", "Medium", "Uplifting",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
                        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"),

                // ==================== Sad & Heartbroken ====================
                new Song("Tum Hi Ho", "Arijit Singh", "Bollywood Ballad", "Sad", "Low", "Heartbroken",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
                        "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=500"),
                new Song("Channa Mereya", "Arijit Singh", "Sufi Rock", "Sad", "Medium", "Heartbroken",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
                        "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500"),
                new Song("Agar Tum Saath Ho", "Arijit Singh, Alka Yagnik", "Bollywood Acoustic", "Sad", "Low", "Heartbroken",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
                        "https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=500"),
                new Song("Hamari Adhuri Kahani", "Arijit Singh", "Bollywood Ballad", "Sad", "Low", "Heartbroken",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
                        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500"),
                new Song("Pachtaoge", "Arijit Singh, B Praak", "Sad Pop", "Sad", "Medium", "Heartbroken",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
                        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500"),

                // ==================== Energetic & Dance ====================
                new Song("Galti Se Mistake", "Arijit Singh, Amit Mishra", "Dance / Pop", "Energetic", "High", "Dance",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
                        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500"),
                new Song("First Class", "Arijit Singh, Neeti Mohan", "Bollywood Dance", "Energetic", "High", "Dance",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"),
                new Song("Ghungroo", "Arijit Singh, Shilpa Rao", "Party / Funk", "Energetic", "High", "Dance",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
                        "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=500"),
                new Song("The Breakup Song", "Arijit Singh, Badshah, Jonita Gandhi", "Club Dance", "Energetic", "High", "Dance",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
                        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500"),
                new Song("Nashe Si Chadh Gayi", "Arijit Singh", "Electronic Dance", "Energetic", "High", "Dance",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"),

                // ==================== Relaxing & Mellow ====================
                new Song("Samjhawan", "Arijit Singh, Shreya Ghoshal", "Sufi Romantic", "Relaxed", "Low", "Mellow",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"),
                new Song("Kesariya", "Arijit Singh, Pritam", "Romantic Melodic", "Relaxed", "Medium", "Mellow",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"),
                new Song("Muskurane", "Arijit Singh", "Acoustic Chill", "Relaxed", "Low", "Mellow",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500"),
                new Song("Qaafirana", "Arijit Singh, Nikhita Gandhi", "Indie Folk", "Relaxed", "Low", "Mellow",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                        "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500"),
                new Song("Roke Na Ruke Naina", "Arijit Singh", "Soulful Acoustic", "Relaxed", "Low", "Mellow",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                        "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=500"),

                // ==================== Focus & Soulful Study ====================
                new Song("Naina", "Arijit Singh", "Acoustic Focus", "Focus", "Low", "Soulful Study",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"),
                new Song("Laal Ishq", "Arijit Singh", "Semi-Classical Focus", "Focus", "Low", "Soulful Study",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
                        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500"),
                new Song("Ae Dil Hai Mushkil (Acoustic)", "Arijit Singh", "Deep Acoustic", "Focus", "Low", "Soulful Study",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
                        "https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=500"),
                new Song("Phir Le Aya Dil", "Arijit Singh, Rekha Bhardwaj", "Ghazal / Study Calm", "Focus", "Low", "Soulful Study",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
                        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"),
                new Song("Sanam Re", "Arijit Singh, Mithoon", "Ambient Pop", "Focus", "Low", "Soulful Study",
                        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"),

                // Ambient & Electronic Classics
                new Song("Midnight City Lights", "Luna Wave", "Electronic", "Energetic", "High", "Night Drive",
                        "https://actions.google.com/sounds/v1/science_fiction/alien_spaceship_flyby.ogg",
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"),
                new Song("Sunset Acoustic Reverie", "The Wanderers", "Indie Folk", "Chill", "Low", "Acoustic Sunset",
                        "https://actions.google.com/sounds/v1/transportation/car_passing.ogg",
                        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500"),
                new Song("Coffee & Lo-Fi Beats", "Chilled Panda", "Lo-Fi", "Focus", "Low", "Study Cafe",
                        "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
                        "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500")
        );

        // Seed songs that do not exist yet
        for (Song song : songsToSeed) {
            if (songRepository.findFirstByTitleIgnoreCase(song.getTitle()).isEmpty()) {
                songRepository.save(song);
            }
        }

        // Create initial playlist for demoUser if they have none
        if (demoUser != null && playlistRepository.findByOwnerId(demoUser.getId()).isEmpty()) {
            List<Song> currentSongs = songRepository.findAll();
            if (currentSongs.size() >= 3) {
                Playlist demoPlaylist = playlistRepository.save(
                        new Playlist("Chill & Focus Hits", "Hand-picked relaxing tunes for work and study", demoUser)
                );
                playlistSongRepository.save(new PlaylistSong(demoPlaylist, currentSongs.get(0)));
                playlistSongRepository.save(new PlaylistSong(demoPlaylist, currentSongs.get(1)));
                playlistSongRepository.save(new PlaylistSong(demoPlaylist, currentSongs.get(2)));
            }
        }
    }
}
