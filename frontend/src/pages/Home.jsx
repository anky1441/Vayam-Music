import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { usePlayer } from "../context/PlayerContext";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import LikedSongs from "./dashboard/LikedSongs.jsx";
import MyPlaylists from "./dashboard/MyPlaylists.jsx";
import CreatePlaylist from "./dashboard/CreatePlaylists.jsx";
import Profile from "./dashboard/Profile.jsx";
import CollabPlaylists from "./CollabPlaylists.jsx";
import MusicPlayer from "../components/MusicPlayer";

import {
    getSongs,
    searchSongs,
    getLikedSongs,
    likeSong,
    unlikeSong,
    getUserPlaylists,
    createPlaylist as createPlaylistApi,
    addSongToPlaylist,
    getPlaylistSongs,
    getMoodRecommendations,
} from "../api/musicApi";

import { isAuthenticated } from "../api/api";

import "./Home.css";
import "./dashboard/DashboardContent.css";

const MOODS = [
    {
        name: "Happy & Uplifting",
        icon: "☀",
        className: "mood-happy",
        description: "Feel-good songs to brighten your day.",
    },
    {
        name: "Sad & Heartbroken",
        icon: "♡",
        className: "mood-sad",
        description: "Songs that understand how you feel.",
    },
    {
        name: "Energetic & Dance",
        icon: "ϟ",
        className: "mood-energy",
        description: "Turn up the volume and move.",
    },
    {
        name: "Relaxing & Mellow",
        icon: "☾",
        className: "mood-relaxing",
        description: "Slow down and find your calm.",
    },
    {
        name: "Focus & Soulful Study",
        icon: "✦",
        className: "mood-focus",
        description: "Find your flow and stay focused.",
    },
];

function getList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.songs)) return data.songs;
    if (Array.isArray(data?.recommendations)) return data.recommendations;
    if (Array.isArray(data?.playlists)) return data.playlists;
    if (Array.isArray(data?.likedSongs)) return data.likedSongs;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function getId(item) {
    if (item && typeof item === "object") {
        return item.id ?? item.songId ?? item.playlistId;
    }

    return item;
}

function sameId(first, second) {
    return String(first) === String(second);
}

function getSongTitle(song) {
    return song?.title || song?.name || "Untitled song";
}

function getSongArtist(song) {
    return song?.artist || song?.artistName || "Unknown artist";
}

function getSongImage(song) {
    return (
        song?.coverUrl ||
        song?.coverImage ||
        song?.imageUrl ||
        song?.image
    );
}

function HomeDiscovery({
    songs,
    songsLoading,
    songsError,
    likedSongs,
    onLike,
    onMoodSelect,
    selectedMood,
    moodLoading,
    moodError,
    onClearMood,
    onPlaySong,
    selectedSong,
    currentSong,
}) {
    const { playSong } = usePlayer();
    return (
        <>
            <section className="music-welcome">
                <p className="music-eyebrow">YOUR MUSIC, YOUR MOOD</p>
                <h1>Good music. Better moods.</h1>
                <p>Find the sounds that match your moment.</p>
            </section>

            <section className="music-section">
                <h2>Explore Your Mood</h2>

                <p className="mood-section-description">
                    Pick the mood you are in and discover music that matches it.
                </p>

                <div className="mood-grid">
                    {MOODS.map((mood) => (
                        <button
                            type="button"
                            key={mood.name}
                            className={`mood-card ${mood.className} ${selectedMood === mood.name ? "mood-card-active" : ""
                                }`}
                            onClick={() => onMoodSelect(mood.name)}
                            disabled={moodLoading}
                            aria-pressed={selectedMood === mood.name}
                        >
                            <span>{mood.icon}</span>

                            <h3>{mood.name}</h3>

                            <p>{mood.description}</p>

                            <span className="mood-card-action">
                                {moodLoading && selectedMood === mood.name
                                    ? "Finding songs..."
                                    : "Explore mood →"}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="music-section">
                <div className="music-section-heading">
                    <h2>
                        {selectedMood ? `Music for ${selectedMood}` : "Trending Songs"}
                    </h2>

                    {selectedMood && (
                        <button
                            type="button"
                            className="mood-reset-button"
                            onClick={onClearMood}
                        >
                            Show trending songs
                        </button>
                    )}
                </div>

                {moodLoading ? (
                    <p>Finding songs for your mood...</p>
                ) : moodError ? (
                    <div className="dashboard-empty">
                        <h3>Couldn't load these recommendations</h3>
                        <p>{moodError}</p>
                        <p>
                            Check whether the backend supports this exact mood name.
                        </p>
                    </div>
                ) : songsLoading ? (
                    <p>Loading songs...</p>
                ) : songsError ? (
                    <p>{songsError}</p>
                ) : songs.length === 0 ? (
                    <div className="dashboard-empty">
                        <h3>No songs found</h3>
                        <p>Try another mood or come back later.</p>
                    </div>
                ) : (
                    <div className="music-discovery-layout">
                        {/* SONG LIST */}
                        <div className="song-grid">
                            {songs.map((song, index) => {
                                const songId = getId(song);
                                const isLiked = likedSongs.some((id) =>
                                    sameId(id, songId)
                                );
                                const isSelected =
                                    selectedSong &&
                                    sameId(getId(selectedSong), songId);

                                return (
                                    <article
                                        key={songId ?? index}
                                        className={`song-card ${isSelected ? "song-card-selected" : ""
                                            }`}
                                        onClick={() => setSelectedSong(song)}
                                    >
                                        <button
                                            type="button"
                                            className="song-card-open"
                                            onClick={() => {
                                                setSelectedSong(song);
                                                onPlaySong(song);
                                            }}
                                            aria-label={`Open ${getSongTitle(song)}`}
                                        >
                                            <div className="song-art">
                                                {getSongImage(song) ? (
                                                    <img
                                                        src={getSongImage(song)}
                                                        alt={getSongTitle(song)}
                                                        className="song-cover-image"
                                                    />
                                                ) : (
                                                    <span>♫</span>
                                                )}

                                                <span className="song-art-play">▶</span>
                                            </div>

                                            <h3>{getSongTitle(song)}</h3>
                                            <p>{getSongArtist(song)}</p>
                                        </button>

                                        <div className="song-card-actions">
                                            <button
                                                type="button"
                                                className="song-play-button"
                                                disabled={!song?.audioUrl}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onPlaySong(song);
                                                }}
                                            >
                                                ▶ Play
                                            </button>

                                            <button
                                                type="button"
                                                className={`dashboard-heart ${isLiked ? "liked" : ""
                                                    }`}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onLike(song);
                                                }}
                                                aria-label={isLiked ? "Unlike song" : "Like song"}
                                            >
                                                {isLiked ? "♥" : "♡"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {/* RIGHT-SIDE MUSIC DETAILS */}
                        <aside className="music-detail-panel">
                            {selectedSong ? (
                                <>
                                    {currentSong &&
                                        selectedSong &&
                                        String(getId(currentSong)) === String(getId(selectedSong)) && (
                                            <div className="music-detail-top">
                                                <span className="music-detail-label">
                                                    <span className="music-live-dot" />
                                                    YOUR CURRENT PICK
                                                </span>

                                                <span className="music-detail-note">
                                                    ♫ VAYAM MUSIC
                                                </span>
                                            </div>
                                        )}

                                    <div className="music-detail-cover-wrap">
                                        {getSongImage(selectedSong) ? (
                                            <img
                                                className="music-detail-cover"
                                                src={getSongImage(selectedSong)}
                                                alt={getSongTitle(selectedSong)}
                                            />
                                        ) : (
                                            <div className="music-detail-cover music-detail-placeholder">
                                                ♫
                                            </div>
                                        )}
                                    </div>

                                    <div className="music-detail-title-row">
                                        <div>
                                            <h2>{getSongTitle(selectedSong)}</h2>
                                            <p>{getSongArtist(selectedSong)}</p>
                                        </div>


                                        <button
                                            type="button"
                                            className={`music-detail-like ${likedSongs.some((id) => sameId(id, getId(selectedSong)))
                                                ? "liked"
                                                : ""
                                                }`}
                                            onClick={() => onLike(selectedSong)}
                                            aria-label={
                                                likedSongs.some((id) => sameId(id, getId(selectedSong)))
                                                    ? "Unlike selected song"
                                                    : "Like selected song"
                                            }
                                        >
                                            {likedSongs.some((id) => sameId(id, getId(selectedSong)))
                                                ? "♥"
                                                : "♡"}
                                        </button>

                                    </div>

                                    <div className="music-detail-tags">
                                        {selectedSong.genre && (
                                            <span>{selectedSong.genre}</span>
                                        )}

                                        {selectedSong.mood && (
                                            <span>{selectedSong.mood}</span>
                                        )}

                                        {selectedSong.vibe && (
                                            <span>{selectedSong.vibe}</span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="music-detail-play"
                                        disabled={!selectedSong.audioUrl}
                                        onClick={() => onPlaySong(selectedSong)}
                                    >
                                        ▶ &nbsp; Play this song
                                    </button>

                                    <div className="music-detail-divider" />

                                    <div className="music-queue-heading">
                                        <div>
                                            <h3>Up Next</h3>
                                            <p>Keep your music going</p>
                                        </div>

                                        <span>{songs.length} tracks</span>
                                    </div>

                                    <div className="music-queue">
                                        {songs
                                            .filter(
                                                (song) =>
                                                    !sameId(getId(song), getId(selectedSong))
                                            )
                                            .map((song, index) => (
                                                <button
                                                    type="button"
                                                    className="music-queue-item"
                                                    key={getId(song) ?? index}
                                                    onClick={() => {
                                                        setSelectedSong(song);
                                                        onPlaySong(song);
                                                    }}
                                                >
                                                    {getSongImage(song) ? (
                                                        <img
                                                            src={getSongImage(song)}
                                                            alt=""
                                                            className="music-queue-cover"
                                                        />
                                                    ) : (
                                                        <span className="music-queue-placeholder">
                                                            ♫
                                                        </span>
                                                    )}

                                                    <span className="music-queue-info">
                                                        <strong>{getSongTitle(song)}</strong>
                                                        <small>{getSongArtist(song)}</small>
                                                    </span>

                                                    <span className="music-queue-play">▶</span>
                                                </button>
                                            ))}
                                    </div>
                                </>
                            ) : (
                                <div className="music-detail-empty">
                                    <div className="music-detail-empty-icon">♫</div>
                                    <h2>Choose your soundtrack</h2>
                                    <p>
                                        Select any song to see its artwork, details and what
                                        to play next.
                                    </p>
                                </div>
                            )}
                        </aside>
                    <div className="song-grid">
                        {songs.map((song) => (
                            <article
                                className="song-card"
                                key={song.id}
                                onClick={() => playSong(song)}
                                style={{ cursor: "pointer" }}
                            >
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLike(song.id);
                                    }}
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

            <section className="music-section">
                <div className="music-section-heading">
                    <h2>Explore by Genre</h2>
                </div>

                <div className="genre-list">
                    {[
                        "Pop",
                        "Indie Folk",
                        "Lo-Fi",
                        "Electronic",
                        "Dance / Pop",
                        "Classical / Ambient",
                        "Synthwave",
                        "R&B / Soul",
                        "Rock",
                    ].map((genre) => (
                        <div key={genre}>{genre}</div>
                    ))}
                </div>
            </section>

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

            <p className="dashboard-eyebrow" style={{ marginTop: 24 }}>
                YOUR PLAYLIST
            </p>

            <h1>{playlist?.name || playlist?.title || "Playlist"}</h1>

            <p className="dashboard-subtitle">
                {playlist?.description || "Your personal music collection"} ·{" "}
                {songs.length} songs
            </p>

            {songs.length === 0 ? (
                <div className="dashboard-empty">
                    <span className="dashboard-big-icon">♫</span>
                    <h2>This playlist is empty</h2>
                    <p>Add songs to start building your collection.</p>
                </div>
            ) : (
                <div className="dashboard-song-list">
                    {songs.map((song, index) => (
                        <div className="dashboard-song" key={getId(song) ?? index}>
                    {playlistSongs.map((song) => (
                        <div
                            className="dashboard-song"
                            key={song.id}
                            onClick={() => playSong(song)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="dashboard-song-art">
                                {getSongImage(song) ? (
                                    <img
                                        src={getSongImage(song)}
                                        alt={getSongTitle(song)}
                                        className="song-cover-image"
                                    />
                                ) : (
                                    "♫"
                                )}
                            </div>

                            <div className="dashboard-song-info">
                                <h3>{getSongTitle(song)}</h3>
                                <p>{getSongArtist(song)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function Home() {
    const location = useLocation();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState(
        location.state?.view || "home"
    );

    const [songs, setSongs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [songsLoading, setSongsLoading] = useState(true);
    const [songsError, setSongsError] = useState("");

    const [currentSong, setCurrentSong] = useState(null);

    const [selectedSong, setSelectedSong] = useState(null);

    function handleSelectSong(song) {
        setSelectedSong(song);
        setCurrentSong(song);
    }

    const [likedSongs, setLikedSongs] = useState([]);
    const [playlists, setPlaylists] = useState([]);

    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryError, setLibraryError] = useState("");

    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [playlistSongs, setPlaylistSongs] = useState([]);
    const [playlistSongsLoading, setPlaylistSongsLoading] = useState(false);

    const [selectedMood, setSelectedMood] = useState("");
    const [moodLoading, setMoodLoading] = useState(false);
    const [moodError, setMoodError] = useState("");

    const requireLogin = useCallback(
        (view) => {
            if (!isAuthenticated()) {
                window.alert("Please log in to use this feature.");

                navigate("/login", {
                    state: { from: "/home", view },
                });

                return false;
            }

            return true;
        },
        [navigate]
    );

    const loadSongs = useCallback(async () => {
        try {
            setSongsLoading(true);
            setSongsError("");

            const response = await getSongs();
            const fetchedSongs = getList(response.data);

            setSongs(fetchedSongs);
        } catch (error) {
            console.error("Failed to fetch songs:", error);

            setSongsError(
                error.response?.data?.message ||
                "Songs could not be loaded. Please try again later."
            );

            setSongs([]);
        } finally {
            setSongsLoading(false);
        }
    }, []);

    const handleSearch = useCallback(async (query) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setIsSearching(false);
            setSearchError("");
            setSelectedMood("");
            await loadSongs();
            return;
        }

        try {
            setSearchLoading(true);
            setSearchError("");
            setIsSearching(true);
            setSelectedMood("");

            const response = await searchSongs(trimmedQuery);
            const results = getList(response.data);

            setSongs(results);
            setSelectedSong(null);

            if (results.length === 0) {
                setSearchError("No songs found. Try another song or artist.");
            }
        } catch (error) {
            console.error("Song search failed:", error);

            setSearchError(
                error.response?.data?.message ||
                "Search failed. Please try again."
            );

            setSongs([]);
        } finally {
            setSearchLoading(false);
        }
    }, [loadSongs]);

    const loadUserLibrary = useCallback(async () => {
        if (!isAuthenticated()) {
            setLikedSongs([]);
            setPlaylists([]);
            setLibraryError("");
            return;
        }

        setLibraryLoading(true);
        setLibraryError("");

        // Load likes and playlists independently so one failure doesn't hide the other.
        const [likesResult, playlistsResult] = await Promise.allSettled([
            getLikedSongs(),
            getUserPlaylists(),
        ]);

        if (likesResult.status === "fulfilled") {
            setLikedSongs(getList(likesResult.value.data).map(getId));
        } else {
            console.error(
                "Failed to load liked songs:",
                likesResult.reason
            );

            setLikedSongs([]);
        }

        if (playlistsResult.status === "fulfilled") {
            setPlaylists(getList(playlistsResult.value.data));
        } else {
            console.error(
                "Failed to load playlists:",
                playlistsResult.reason
            );

            setPlaylists([]);
        }

        if (
            likesResult.status === "rejected" &&
            playlistsResult.status === "rejected"
        ) {
            setLibraryError(
                "Your library could not be loaded. Please check your login and try again."
            );
        } else if (
            likesResult.status === "rejected" ||
            playlistsResult.status === "rejected"
        ) {
            setLibraryError(
                "Some library information could not be loaded. Please try again."
            );
        }

        setLibraryLoading(false);
    }, []);

    useEffect(() => {
        loadSongs();
    }, [loadSongs]);

    useEffect(() => {
        if (isAuthenticated()) {
            loadUserLibrary();
        }
    }, [loadUserLibrary]);

    async function handleLike(song) {
        if (!requireLogin("liked")) return;

        const songId = getId(song);

        const currentlyLiked = likedSongs.some((id) =>
            sameId(id, songId)
        );

        // Optimistic UI update; restore the previous state if the API fails.
        const previousLikedSongs = likedSongs;

        setLikedSongs((current) =>
            currentlyLiked
                ? current.filter((id) => !sameId(id, songId))
                : [...current, songId]
        );

        try {
            if (currentlyLiked) {
                await unlikeSong(songId);
            } else {
                await likeSong(songId);
            }
        } catch (error) {
            console.error("Failed to update song like:", error);

            setLikedSongs(previousLikedSongs);

            window.alert(
                error.response?.data?.message ||
                "Couldn't update this like. Please try again."
            );
        }
    }

    async function handleMoodSelect(mood) {
        setSelectedMood(mood);
        setMoodLoading(true);
        setMoodError("");

        try {
            const response = await getMoodRecommendations(mood);
            const recommendations = getList(response.data);

            setSongs(recommendations);

            if (recommendations.length === 0) {
                setMoodError(
                    "The recommendation service returned no songs for this mood."
                );
            }
        } catch (error) {
            console.error(
                `Failed to load recommendations for "${mood}":`,
                error
            );

            setMoodError(
                error.response?.data?.message ||
                `Recommendations for "${mood}" could not be loaded.`
            );

            setSongs([]);
        } finally {
            setMoodLoading(false);
        }
    }

    async function handleClearMood() {
        setSelectedMood("");
        setMoodError("");

        await loadSongs();
    }

    async function handleCreatePlaylist(data) {
        if (!requireLogin("create")) return;

        try {
            const response = await createPlaylistApi({
                name: data.name,
                description: data.description || "",
            });

            const createdPlaylist = response.data?.playlist || response.data;
            const playlistId = getId(createdPlaylist);

            // Save selected songs through the backend, if the form supplied them.
            const selectedSongIds = Array.isArray(data.songs)
                ? data.songs.map(getId).filter(Boolean)
                : [];

            if (playlistId && selectedSongIds.length > 0) {
                await Promise.all(
                    selectedSongIds.map((songId) =>
                        addSongToPlaylist(playlistId, songId)
                    )
                );
            }

            await loadUserLibrary();

            if (playlistId) {
                setSelectedPlaylistId(playlistId);
                setActiveView("playlist-details");
            } else {
                setActiveView("playlists");
            }
        } catch (error) {
            console.error("Failed to create playlist:", error);

            window.alert(
                error.response?.data?.message ||
                "Playlist could not be created. Please try again."
            );
        }
    }

    async function openPlaylist(id) {
        setSelectedPlaylistId(id);
        setActiveView("playlist-details");
        setPlaylistSongs([]);
        setPlaylistSongsLoading(true);

        try {
            const response = await getPlaylistSongs(id);

            setPlaylistSongs(getList(response.data));
        } catch (error) {
            console.error("Failed to load playlist songs:", error);

            window.alert(
                error.response?.data?.message ||
                "Playlist songs could not be loaded."
            );
        } finally {
            setPlaylistSongsLoading(false);
        }
    }

    function openView(view) {
        if (
            ["liked", "playlists", "create", "collab", "profile"].includes(view) &&
            !requireLogin(view)
        ) {
            return;
        }

        setActiveView(view);
        setSelectedPlaylistId(null);
    }

    const selectedPlaylist = playlists.find((playlist) =>
        sameId(getId(playlist), selectedPlaylistId)
    );

    return (
        <div className="music-home">
            <Navbar
                onProfileClick={() => openView("profile")}
                onHomeClick={() => openView("home")}
                onSearch={handleSearch}
            />

            <div className="music-home-layout">
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
                        className={`library-item ${["playlists", "playlist-details"].includes(activeView)
                            ? "active"
                            : ""
                            }`}
                        onClick={() => openView("playlists")}
                    >
                        <span>☷</span> My Playlists
                    </button>

                    <button
                        type="button"
                        className={`library-item ${activeView === "collab" ? "active" : ""
                            }`}
                        onClick={() => openView("collab")}
                    >
                        <span>♬</span> Collaborative Playlists
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

                    {libraryLoading && (
                        <p className="library-status">Syncing your library...</p>
                    )}

                    {libraryError && (
                        <div className="library-error">
                            <p>{libraryError}</p>

                            <button type="button" onClick={loadUserLibrary}>
                                Try again
                            </button>
                        </div>
                    )}
                </aside>

                <main className="music-content">
                    {activeView === "home" && (
                        <HomeDiscovery
                            songs={songs}
                            currentSong={currentSong}
                            songsLoading={songsLoading}
                            songsError={songsError}
                            likedSongs={likedSongs}
                            onLike={handleLike}
                            onMoodSelect={handleMoodSelect}
                            selectedMood={selectedMood}
                            moodLoading={moodLoading}
                            moodError={moodError}
                            onClearMood={handleClearMood}

                            selectedSong={selectedSong}
                            onPlaySong={handleSelectSong}
                        />
                    )}

                    {activeView === "liked" && (
                        <LikedSongs
                            songs={songs}
                            likedSongs={likedSongs}
                            onToggleLike={(songOrId) =>
                                handleLike(
                                    typeof songOrId === "object"
                                        ? songOrId
                                        : songs.find((song) =>
                                            sameId(getId(song), songOrId)
                                        ) || { id: songOrId }
                                )
                            }
                        />
                    )}

                    {activeView === "playlists" && (
                        <MyPlaylists
                            playlists={playlists}
                            onSelectPlaylist={openPlaylist}
                        />
                    )}

                    {activeView === "create" && (
                        <CreatePlaylist
                            songs={songs}
                            onCreatePlaylist={handleCreatePlaylist}
                        />
                    )}

                    {activeView === "playlist-details" &&
                        (playlistSongsLoading ? (
                            <section className="dashboard-view">
                                <p>Loading playlist songs...</p>
                            </section>
                        ) : selectedPlaylist ? (
                            <PlaylistDetails
                                playlist={selectedPlaylist}
                                songs={playlistSongs}
                                onBack={() => openView("playlists")}
                            />
                        ) : (
                            <section className="dashboard-view">
                                <h2>Playlist not found</h2>

                                <button
                                    type="button"
                                    className="dashboard-add-button"
                                    onClick={() => openView("playlists")}
                                >
                                    ← My Playlists
                                </button>
                            </section>
                        ))}

                    {activeView === "collab" && <CollabPlaylists />}

                    {activeView === "profile" && (
                        <Profile
                            playlists={playlists}
                            onSelectPlaylist={openPlaylist}
                        />
                    )}

                    <Footer showCTA={false} />
                </main>
            </div>

            {currentSong && (
                <MusicPlayer
                    song={currentSong}
                    onClose={() => setCurrentSong(null)}
                />
            )}
        </div>
    );
}

export default Home;