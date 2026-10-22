import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import LikedSongs from "./dashboard/LikedSongs.jsx";
import MyPlaylists from "./dashboard/MyPlaylists.jsx";
import CreatePlaylist from "./dashboard/CreatePlaylists.jsx";
import Profile from "./dashboard/Profile.jsx";

import { getSongs } from "../api/musicApi";

import "./Home.css";
import "./dashboard/DashboardContent.css";

function HomeDiscovery({
    songs,
    songsLoading,
    songsError,
    onLike,
    likedSongs,
}) {
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
                    <div className="mood-card mood-chill">
                        <span>☾</span>
                        <h3>Chill Vibes</h3>
                    </div>

                    <div className="mood-card mood-energy">
                        <span>ϟ</span>
                        <h3>Energy Boost</h3>
                    </div>

                    <div className="mood-card mood-romantic">
                        <span>♡</span>
                        <h3>Romantic</h3>
                    </div>

                    <div className="mood-card mood-focus">
                        <span>✦</span>
                        <h3>Deep Focus</h3>
                    </div>
                </div>
            </section>

            {/* Trending Songs */}
            <section className="music-section">
                <div className="music-section-heading">
                    <h2>Trending Songs</h2>
                    <span>Discover more →</span>
                </div>

                {songsLoading ? (
                    <p>Loading songs...</p>
                ) : songsError ? (
                    <p>{songsError}</p>
                ) : songs.length === 0 ? (
                    <p>No songs available right now.</p>
                ) : (
                    <div className="song-grid">
                        {songs.map((song) => (
                            <article className="song-card" key={song.id}>
                                <div className="song-art">
                                    {song.coverUrl ? (
                                        <img
                                            src={song.coverUrl}
                                            alt={song.title}
                                            className="song-cover-image"
                                        />
                                    ) : (
                                        <span>♫</span>
                                    )}
                                </div>

                                <h3>{song.title}</h3>
                                <p>{song.artist}</p>

                                <button
                                    type="button"
                                    className={`dashboard-heart ${likedSongs.includes(song.id)
                                            ? "liked"
                                            : ""
                                        }`}
                                    onClick={() => onLike(song.id)}
                                    aria-label={`Like ${song.title}`}
                                >
                                    {likedSongs.includes(song.id)
                                        ? "♥"
                                        : "♡"}
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Genre Section */}
            <section className="music-section">
                <div className="music-section-heading">
                    <h2>Explore by Genre</h2>
                </div>

                <div className="genre-list">
                    <div>Pop</div>
                    <div>Indie</div>
                    <div>Lo-fi</div>
                    <div>Classical</div>
                    <div>Rock</div>
                    <div>Instrumental</div>
                </div>
            </section>

            {/* Playlist Banner */}
            <section className="playlist-banner">
                <p>MAKE IT YOURS</p>
                <h2>Create a playlist for every version of you.</h2>
                <p>
                    Bring your favourite sounds together in one place.
                </p>
            </section>
        </>
    );
}

function PlaylistDetails({ playlist, songs, onBack }) {
    const playlistSongIds = Array.isArray(playlist.songs)
        ? playlist.songs
        : [];

    const playlistSongs = songs.filter((song) =>
        playlistSongIds.includes(song.id)
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

            <p
                className="dashboard-eyebrow"
                style={{ marginTop: 24 }}
            >
                YOUR PLAYLIST
            </p>

            <h1>{playlist.name}</h1>

            <p className="dashboard-subtitle">
                {playlist.description || "Your personal music collection"}
                {" · "}
                {playlistSongs.length} songs
            </p>

            {playlistSongs.length === 0 ? (
                <div className="dashboard-empty">
                    <span className="dashboard-big-icon">♫</span>
                    <h2>This playlist is empty</h2>
                    <p>
                        You can add songs when creating a playlist.
                    </p>
                </div>
            ) : (
                <div className="dashboard-song-list">
                    {playlistSongs.map((song) => (
                        <div className="dashboard-song" key={song.id}>
                            <div className="dashboard-song-art">
                                {song.coverUrl ? (
                                    <img
                                        src={song.coverUrl}
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


    const [activeView, setActiveView] = useState(
        location.state?.view === "profile" ? "profile" : "home"
    );
    // Songs from backend
    const [songs, setSongs] = useState([]);
    const [songsLoading, setSongsLoading] = useState(true);
    const [songsError, setSongsError] = useState("");

    // Locally saved likes
    const [likedSongs, setLikedSongs] = useState(() =>
        readLocalStorage("vayam-liked-songs", [])
    );

    // Locally saved playlists
    const [playlists, setPlaylists] = useState(() =>
        readLocalStorage("vayam-playlists", [])
    );

    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

    // Fetch songs from the backend
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
                    setSongsError(
                        "Songs load nahi ho paaye. Please try again later."
                    );
                }
            } finally {
                if (isMounted) {
                    setSongsLoading(false);
                }
            }
        }

        fetchSongs();

        return () => {
            isMounted = false;
        };
    }, []);

    // Save likes locally
    useEffect(() => {
        localStorage.setItem(
            "vayam-liked-songs",
            JSON.stringify(likedSongs)
        );
    }, [likedSongs]);

    // Save playlists locally
    useEffect(() => {
        localStorage.setItem(
            "vayam-playlists",
            JSON.stringify(playlists)
        );
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

    const selectedPlaylist = playlists.find(
        (playlist) => playlist.id === selectedPlaylistId
    );

    return (
        <div className="music-home">
            <Navbar
                onProfileClick={() => openView("profile")}
                onHomeClick={() => openView("home")}
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
                        className={`library-item ${activeView === "liked" ? "active" : ""
                            }`}
                        onClick={() => openView("liked")}
                    >
                        <span>♡</span> Liked Songs
                    </button>

                    <button
                        type="button"
                        className={`library-item ${activeView === "playlists" ||
                                activeView === "playlist-details"
                                ? "active"
                                : ""
                            }`}
                        onClick={() => openView("playlists")}
                    >
                        <span>☷</span> My Playlists
                    </button>

                    <div className="create-playlist-box">
                        <span className="create-playlist-icon">＋</span>

                        <h3>Create Playlist</h3>

                        <p>
                            Create a collection of your favourite songs.
                        </p>

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

                    {activeView === "playlist-details" &&
                        selectedPlaylist && (
                            <PlaylistDetails
                                playlist={selectedPlaylist}
                                songs={songs}
                                onBack={() => openView("playlists")}
                            />
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