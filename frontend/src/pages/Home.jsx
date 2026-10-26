import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import LikedSongs from "./dashboard/LikedSongs.jsx";
import MyPlaylists from "./dashboard/MyPlaylists.jsx";
import CreatePlaylist from "./dashboard/CreatePlaylists.jsx";
import Profile from "./dashboard/Profile.jsx";
import CollabPlaylists from "./CollabPlaylists.jsx";
import StorySong from "./dashboard/StorySong.jsx";

import { getSongs, getLikedSongs, getUserPlaylists, searchCatalogSongs } from "../api/musicApi";
import { isAuthenticated } from "../api/api";

import "./Home.css";
import "./dashboard/DashboardContent.css";

function HomeDiscovery({
    songs,
    songsLoading,
    songsError,
    onLike,
    likedSongs,
    searchQuery = "",
    catalogSongs = [],
    onClearSearch,
    onSelectGenre,
}) {
    const { playSong } = usePlayer();
    const [selectedMood, setSelectedMood] = useState("");

    const trimmedQuery = (searchQuery || "").trim().toLowerCase();

    // Combined filter: mood + search text (title, artist, genre, mood)
    const filteredSongs = songs.filter((song) => {
        if (selectedMood) {
            const matchesMood =
                song.mood?.toLowerCase().includes(selectedMood.toLowerCase()) ||
                song.genre?.toLowerCase().includes(selectedMood.toLowerCase());
            if (!matchesMood) return false;
        }

        if (trimmedQuery) {
            const title = (song.title || "").toLowerCase();
            const artist = (song.artist || "").toLowerCase();
            const genre = (song.genre || "").toLowerCase();
            const mood = (song.mood || "").toLowerCase();

            return (
                title.includes(trimmedQuery) ||
                artist.includes(trimmedQuery) ||
                genre.includes(trimmedQuery) ||
                mood.includes(trimmedQuery)
            );
        }

        return true;
    });

    // Merge filtered database songs with matching catalog songs from the 114k Spotify dataset
    const seen = new Set();
    const displaySongs = [];

    for (const song of [...filteredSongs, ...(catalogSongs || [])]) {
        const key = `${(song.title || "").toLowerCase().trim()}_${(song.artist || "").toLowerCase().trim()}`;
        if (!seen.has(key)) {
            seen.add(key);
            displaySongs.push(song);
        }
    }

    return (
        <>
            {/* Welcome Section */}
            <section className="music-welcome">
                <p className="music-eyebrow">YOUR MUSIC, YOUR MOOD</p>
                <h1>Good music. Better moods.</h1>
                <p>Find the sounds that match your moment.</p>
            </section>

            {/* Mood Section */}
            <section className="music-section">
                <h2>Explore Your Mood</h2>

                <div className="mood-grid">
                    <div
                        className={`mood-card mood-chill ${selectedMood === "chill" ? "active" : ""}`}
                        onClick={() => setSelectedMood(selectedMood === "chill" ? "" : "chill")}
                        style={{ cursor: "pointer" }}
                    >
                        <span>☾</span>
                        <h3>Chill Vibes</h3>
                    </div>

                    <div
                        className={`mood-card mood-energy ${selectedMood === "energy" ? "active" : ""}`}
                        onClick={() => setSelectedMood(selectedMood === "energy" ? "" : "energy")}
                        style={{ cursor: "pointer" }}
                    >
                        <span>ϟ</span>
                        <h3>Energy Boost</h3>
                    </div>

                    <div
                        className={`mood-card mood-romantic ${selectedMood === "romantic" ? "active" : ""}`}
                        onClick={() => setSelectedMood(selectedMood === "romantic" ? "" : "romantic")}
                        style={{ cursor: "pointer" }}
                    >
                        <span>♡</span>
                        <h3>Romantic</h3>
                    </div>

                    <div
                        className={`mood-card mood-focus ${selectedMood === "focus" ? "active" : ""}`}
                        onClick={() => setSelectedMood(selectedMood === "focus" ? "" : "focus")}
                        style={{ cursor: "pointer" }}
                    >
                        <span>✦</span>
                        <h3>Deep Focus</h3>
                    </div>
                </div>
            </section>

            {/* Trending Songs / Search Results */}
            <section className="music-section">
                <div className="music-section-heading">
                    <h2>
                        {trimmedQuery
                            ? `Search Results for "${searchQuery}" (${displaySongs.length})`
                            : selectedMood
                            ? `Trending Songs · ${selectedMood.toUpperCase()}`
                            : "Trending Songs"}
                    </h2>
                    {(selectedMood || trimmedQuery) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMood("");
                                onClearSearch?.();
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#c4a1ff",
                                cursor: "pointer",
                                fontSize: "13px",
                            }}
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {songsLoading ? (
                    <p>Loading songs...</p>
                ) : songsError ? (
                    <p>{songsError}</p>
                ) : displaySongs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#b9adc9" }}>
                        <p style={{ fontSize: "16px", color: "#fff", marginBottom: "8px" }}>
                            No songs found matching "{searchQuery || selectedMood}".
                        </p>
                        <p style={{ fontSize: "13px", marginBottom: "16px" }}>
                            Try searching for another song title, artist name, or genre.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMood("");
                                onClearSearch?.();
                            }}
                            style={{
                                background: "rgba(139, 92, 246, 0.2)",
                                border: "1px solid rgba(139, 92, 246, 0.4)",
                                color: "#d8b4fe",
                                borderRadius: "999px",
                                padding: "8px 20px",
                                fontSize: "13px",
                                cursor: "pointer",
                            }}
                        >
                            Show all songs
                        </button>
                    </div>
                ) : (
                    <div className="song-grid">
                        {displaySongs.map((song) => {
                            const songId = song.id || song._id;
                            const isLiked = likedSongs.some(
                                (id) => String(id) === String(songId)
                            );
                            return (
                                <article
                                    className="song-card"
                                    key={songId}
                                    onClick={() => playSong(song)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="song-art">
                                        {song.coverUrl || song.coverImage ? (
                                            <img
                                                src={song.coverUrl || song.coverImage}
                                                alt={song.title}
                                                className="song-cover-image"
                                            />
                                        ) : (
                                            <span>♫</span>
                                        )}
                                        <span className="song-art-play">▶</span>
                                    </div>

                                    <h3>{song.title}</h3>
                                    <p>{song.artist}</p>

                                    <button
                                        type="button"
                                        className={`dashboard-heart ${isLiked ? "liked" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLike(songId);
                                        }}
                                        aria-label={`Like ${song.title}`}
                                    >
                                        {isLiked ? "♥" : "♡"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Genre Section */}
            <section className="music-section">
                <div className="music-section-heading">
                    <h2>Explore by Genre</h2>
                </div>

                <div className="genre-list">
                    {["Pop", "Indie", "Lo-fi", "Classical", "Rock", "Instrumental"].map((genre) => (
                        <div
                            key={genre}
                            onClick={() => onSelectGenre?.(genre)}
                            style={{ cursor: "pointer" }}
                            title={`Filter by ${genre}`}
                        >
                            {genre}
                        </div>
                    ))}
                </div>
            </section>

            {/* Playlist Banner */}
            <section className="playlist-banner">
                <p>MAKE IT YOURS</p>
                <h2>Create a playlist for every version of you.</h2>
                <p>Bring your favourite sounds together in one place.</p>
            </section>
        </>
    );
}

function PlaylistDetails({ playlist, songs, onBack }) {
    const { playSong } = usePlayer();
    const playlistSongIds = Array.isArray(playlist.songs) ? playlist.songs : [];

    const playlistSongs = songs.filter((song) =>
        playlistSongIds.includes(song.id || song._id)
    );

    return (
        <section className="dashboard-view">
            <button
                type="button"
                className="dashboard-add-button"
                onClick={onBack}
            >
                ← My Playlists
            </button>

            <p className="dashboard-eyebrow" style={{ marginTop: 24 }}>
                YOUR PLAYLIST
            </p>

            <h1>{playlist.name || playlist.title}</h1>

            <p className="dashboard-subtitle">
                {playlist.description || "Your personal music collection"} ·{" "}
                {playlistSongs.length} songs
            </p>

            {playlistSongs.length === 0 ? (
                <div className="dashboard-empty">
                    <span className="dashboard-big-icon">♫</span>
                    <h2>This playlist is empty</h2>
                    <p>You can add songs when creating a playlist.</p>
                </div>
            ) : (
                <div className="dashboard-song-list">
                    {playlistSongs.map((song) => (
                        <div
                            className="dashboard-song"
                            key={song.id || song._id}
                            onClick={() => playSong(song)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="dashboard-song-art">
                                {song.coverUrl || song.coverImage ? (
                                    <img
                                        src={song.coverUrl || song.coverImage}
                                        alt={song.title}
                                        className="song-cover-image"
                                    />
                                ) : (
                                    "♫"
                                )}
                            </div>

                            <div className="dashboard-song-info">
                                <h3>{song.title}</h3>
                                <p>{song.artist}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function readLocalStorage(key, fallback) {
    try {
        const savedData = localStorage.getItem(key);
        return savedData ? JSON.parse(savedData) : fallback;
    } catch {
        return fallback;
    }
}

function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const { playSong } = usePlayer();

    const [activeView, setActiveView] = useState(
        location.state?.view || "home"
    );

    // Sync search query from URL parameter if present (?search=xyz)
    const urlQuery = new URLSearchParams(location.search).get("search") || "";
    const [searchQuery, setSearchQuery] = useState(urlQuery);

    useEffect(() => {
        const query = new URLSearchParams(location.search).get("search") || "";
        if (query !== searchQuery) {
            setSearchQuery(query);
        }
    }, [location.search]);

    const [songs, setSongs] = useState([]);
    const [songsLoading, setSongsLoading] = useState(true);
    const [songsError, setSongsError] = useState("");
    const [catalogSongs, setCatalogSongs] = useState([]);

    // Live search in 114k catalog when searchQuery is entered
    useEffect(() => {
        let isMounted = true;
        if (!searchQuery.trim()) {
            setCatalogSongs([]);
            return;
        }

        const timer = setTimeout(async () => {
            const results = await searchCatalogSongs(searchQuery.trim(), 12);
            if (isMounted) {
                setCatalogSongs(Array.isArray(results) ? results : []);
            }
        }, 180);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    // Likes from localStorage (or database if authenticated)
    const [likedSongs, setLikedSongs] = useState(() =>
        readLocalStorage("vayam-liked-songs", [])
    );

    // Playlists
    const [playlists, setPlaylists] = useState(() =>
        readLocalStorage("vayam-playlists", [])
    );

    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

    // Fetch songs
    useEffect(() => {
        let isMounted = true;

        async function fetchSongs() {
            try {
                setSongsLoading(true);
                setSongsError("");

                const response = await getSongs();

                if (isMounted) {
                    const fetchedSongs = Array.isArray(response.data)
                        ? response.data
                        : [];
                    setSongs(fetchedSongs);
                }
            } catch (error) {
                console.error("Failed to fetch songs:", error);
                if (isMounted) {
                    setSongsError("Could not load songs. Please try again later.");
                }
            } finally {
                if (isMounted) {
                    setSongsLoading(false);
                }
            }
        }

        fetchSongs();

        // Also sync user's online likes and playlists if logged in
        if (isAuthenticated()) {
            getLikedSongs()
                .then((res) => {
                    if (isMounted && Array.isArray(res.data)) {
                        setLikedSongs(res.data.map((s) => s.id || s));
                    }
                })
                .catch(() => {});

            getUserPlaylists()
                .then((res) => {
                    if (isMounted && Array.isArray(res.data)) {
                        setPlaylists(res.data);
                    }
                })
                .catch(() => {});
        }

        return () => {
            isMounted = false;
        };
    }, []);

    // Save likes locally
    useEffect(() => {
        localStorage.setItem("vayam-liked-songs", JSON.stringify(likedSongs));
    }, [likedSongs]);

    // Save playlists locally
    useEffect(() => {
        localStorage.setItem("vayam-playlists", JSON.stringify(playlists));
    }, [playlists]);

    function toggleLike(songId) {
        setLikedSongs((current) =>
            current.includes(songId)
                ? current.filter((id) => id !== songId)
                : [...current, songId]
        );
    }

    function createPlaylist(data) {
        const playlist = {
            ...data,
            id: `playlist-${Date.now()}`,
            songs: Array.isArray(data.songs) ? data.songs : [],
        };

        setPlaylists((current) => [...current, playlist]);
        setSelectedPlaylistId(playlist.id);
        setActiveView("playlist-details");
    }

    function openView(view) {
        setActiveView(view);
        setSelectedPlaylistId(null);
    }

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (activeView !== "home") {
            setActiveView("home");
        }
    };

    const selectedPlaylist = playlists.find(
        (playlist) => (playlist.id || playlist._id) === selectedPlaylistId
    );

    return (
        <div className="music-home">
            <Navbar
                onProfileClick={() => openView("profile")}
                onHomeClick={() => {
                    openView("home");
                    setSearchQuery("");
                }}
                onSearch={handleSearch}
                searchQuery={searchQuery}
            />

            <div className="music-home-layout">
                {/* Sidebar */}
                <aside className="music-sidebar">
                    <div className="library-heading">
                        <span className="library-icon">♫</span>
                        <h2>Your Library</h2>
                    </div>

                    <button
                        type="button"
                        className={`library-item ${activeView === "liked" ? "active" : ""}`}
                        onClick={() => openView("liked")}
                    >
                        <span>♡</span> Liked Songs
                    </button>

                    <button
                        type="button"
                        className={`library-item ${
                            ["playlists", "playlist-details"].includes(activeView) ? "active" : ""
                        }`}
                        onClick={() => openView("playlists")}
                    >
                        <span>☷</span> My Playlists
                    </button>

                    {/* Additional Feature: Collaborative Playlists */}
                    <button
                        type="button"
                        className={`library-item ${activeView === "collab" ? "active" : ""}`}
                        onClick={() => openView("collab")}
                    >
                        <span>♬</span> Collaborative Playlists
                    </button>

                    {/* Additional Feature: AI StorySong */}
                    <button
                        type="button"
                        className={`library-item ${activeView === "storysong" ? "active" : ""}`}
                        onClick={() => openView("storysong")}
                    >
                        <span>✨</span> AI StorySong
                    </button>

                    <div className="create-playlist-box">
                        <span className="create-playlist-icon">＋</span>
                        <h3>Create Playlist</h3>
                        <p>Create a collection of your favourite songs.</p>
                        <button
                            type="button"
                            className="create-playlist-button"
                            onClick={() => openView("create")}
                        >
                            Create Playlist
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="music-content">
                    {activeView === "home" && (
                        <HomeDiscovery
                            songs={songs}
                            songsLoading={songsLoading}
                            songsError={songsError}
                            onLike={toggleLike}
                            likedSongs={likedSongs}
                            searchQuery={searchQuery}
                            catalogSongs={catalogSongs}
                            onClearSearch={() => setSearchQuery("")}
                            onSelectGenre={(genre) => handleSearch(genre)}
                        />
                    )}

                    {activeView === "liked" && (
                        <LikedSongs
                            songs={songs}
                            likedSongs={likedSongs}
                            onToggleLike={toggleLike}
                        />
                    )}

                    {activeView === "playlists" && (
                        <MyPlaylists
                            playlists={playlists}
                            onSelectPlaylist={(id) => {
                                setSelectedPlaylistId(id);
                                setActiveView("playlist-details");
                            }}
                        />
                    )}

                    {activeView === "create" && (
                        <CreatePlaylist
                            songs={songs}
                            onCreatePlaylist={createPlaylist}
                        />
                    )}

                    {activeView === "playlist-details" && selectedPlaylist && (
                        <PlaylistDetails
                            playlist={selectedPlaylist}
                            songs={songs}
                            onBack={() => openView("playlists")}
                        />
                    )}

                    {/* Additional Feature: Collaborative Playlists */}
                    {activeView === "collab" && <CollabPlaylists />}

                    {/* Additional Feature: AI StorySong */}
                    {activeView === "storysong" && (
                        <StorySong onPlaySong={playSong} />
                    )}

                    {activeView === "profile" && (
                        <Profile
                            playlists={playlists}
                            onSelectPlaylist={(id) => {
                                setSelectedPlaylistId(id);
                                setActiveView("playlist-details");
                            }}
                        />
                    )}

                    <Footer showCTA={false} />
                </main>
            </div>
        </div>
    );
}

export default Home;