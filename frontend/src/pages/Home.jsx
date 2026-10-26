import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SongCard from "../components/SongCard";

import LikedSongs from "./dashboard/LikedSongs.jsx";
import MyPlaylists from "./dashboard/MyPlaylists.jsx";
import CreatePlaylist from "./dashboard/CreatePlaylists.jsx";
import Profile from "./dashboard/Profile.jsx";
import Moods from "./dashboard/Moods.jsx";
import Search from "./dashboard/Search.jsx";
import Recommendations from "./dashboard/Recommendations.jsx";
import SongDetails from "./dashboard/SongDetails.jsx";
import PlaylistGenerator from "./dashboard/PlaylistGenerator.jsx";
import StorySong from "./dashboard/StorySong.jsx";
import PlaylistDetails from "./dashboard/PlaylistDetails.jsx";

import { getSongs } from "../api/musicApi";
import useLibrary from "../hooks/useLibrary";
import { toList, unwrapSong } from "../utils/music";

import "./Home.css";
import "./dashboard/DashboardContent.css";
import "./dashboard/Discover.css";

const HOME_MOODS = [
    { key: "chill", icon: "☾", label: "Chill Vibes", className: "mood-chill" },
    { key: "energetic", icon: "ϟ", label: "Energy Boost", className: "mood-energy" },
    { key: "romantic", icon: "♡", label: "Romantic", className: "mood-romantic" },
    { key: "focus", icon: "✦", label: "Deep Focus", className: "mood-focus" },
];

function HomeDiscovery({
    songs,
    songsLoading,
    songsError,
    isLiked,
    onToggleLike,
    onOpenSong,
    onSelectMood,
    onOpenMoods,
    onOpenForYou,
    onOpenCreate,
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
                <div className="music-section-heading">
                    <h2>Explore Your Mood</h2>
                    <span onClick={onOpenMoods}>All moods →</span>
                </div>

                <div className="mood-grid">
                    {HOME_MOODS.map((mood) => (
                        <button
                            type="button"
                            key={mood.key}
                            className={`mood-card mood-card-button ${mood.className}`}
                            onClick={() => onSelectMood(mood.key)}
                        >
                            <span>{mood.icon}</span>
                            <h3>{mood.label}</h3>
                        </button>
                    ))}
                </div>
            </section>

            {/* Trending Songs */}
            <section className="music-section">
                <div className="music-section-heading">
                    <h2>Trending Songs</h2>
                    <span onClick={onOpenForYou}>Discover more →</span>
                </div>

                {songsLoading ? (
                    <div className="song-grid">
                        {[1, 2, 3, 4].map((n) => <div key={n} className="dv-skeleton" />)}
                    </div>
                ) : songsError ? (
                    <p className="dv-error" role="alert">{songsError}</p>
                ) : songs.length === 0 ? (
                    <p>No songs available right now.</p>
                ) : (
                    <div className="song-grid">
                        {songs.slice(0, 8).map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                liked={isLiked(song.id)}
                                onToggleLike={onToggleLike}
                                onOpen={onOpenSong}
                            />
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
                <p>Bring your favourite sounds together in one place.</p>
                <button type="button" className="banner-button" onClick={onOpenCreate}>
                    Create a playlist
                </button>
            </section>
        </>
    );
}

function Home() {
    const location = useLocation();
    const navigate = useNavigate();
    const entry = location.state;

    // Which panel is open in the main area.
    const [activeView, setActiveView] = useState(() => {
        if (entry?.view === "profile") return "profile";
        if (entry?.view === "search") return "search";
        if (entry?.view === "song" && entry.songId !== undefined) return "song";
        return "home";
    });
    const [searchQuery, setSearchQuery] = useState(entry?.query || "");
    const [selectedMood, setSelectedMood] = useState(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [selectedSongId, setSelectedSongId] = useState(entry?.songId ?? null);
    const [songBackView, setSongBackView] = useState("home");

    // Songs from the backend
    const [songs, setSongs] = useState([]);
    const [songsLoading, setSongsLoading] = useState(true);
    const [songsError, setSongsError] = useState("");

    // Liked songs + playlists (synced with the backend)
    const library = useLibrary();

    useEffect(() => {
        let isMounted = true;

        async function fetchSongs() {
            try {
                setSongsLoading(true);
                setSongsError("");

                const response = await getSongs();
                if (isMounted) setSongs(toList(response.data).map(unwrapSong));
            } catch (error) {
                console.error("Failed to fetch songs:", error);
                if (isMounted) {
                    setSongsError("Songs could not be loaded. Please try again later.");
                }
            } finally {
                if (isMounted) setSongsLoading(false);
            }
        }

        fetchSongs();
        return () => {
            isMounted = false;
        };
    }, []);

    // Start every panel at the top.
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [activeView, selectedMood, selectedPlaylistId, selectedSongId]);

    // Hide the error/notice banner after a few seconds.
    const { notice, clearNotice } = library;
    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(clearNotice, 5000);
        return () => clearTimeout(timer);
    }, [notice, clearNotice]);

    function openView(view) {
        setActiveView(view);
        setSelectedPlaylistId(null);
    }

    function openMood(moodKey) {
        setSelectedMood(moodKey);
        setSelectedPlaylistId(null);
        setActiveView("moods");
    }

    function openPlaylist(id) {
        setSelectedPlaylistId(id);
        setActiveView("playlist-details");
    }

    function openSong(song) {
        if (activeView !== "song") setSongBackView(activeView);
        setSelectedSongId(song.id);
        setActiveView("song");
    }

    function runSearch(query) {
        setSearchQuery(query);
        setSelectedPlaylistId(null);
        setActiveView("search");
    }

    async function handleCreatePlaylist(data) {
        const created = await library.createPlaylist(data);
        openPlaylist(created.id);
    }

    const sidebarActive = (...views) => (views.includes(activeView) ? "active" : "");

    return (
        <div className="music-home">
            <Navbar
                onProfileClick={() => openView("profile")}
                onHomeClick={() => {
                    openView("home");
                }}
                onSearch={runSearch}
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
                        className={`library-item ${sidebarActive("liked")}`}
                        onClick={() => openView("liked")}
                    >
                        <span>♡</span> Liked Songs
                    </button>

                    <button
                        type="button"
                        className={`library-item ${sidebarActive("playlists", "playlist-details")}`}
                        onClick={() => openView("playlists")}
                    >
                        <span>☷</span> My Playlists
                    </button>

                    <button
                        type="button"
                        className="library-item"
                        onClick={() => navigate("/collab")}
                    >
                        <span>◎</span> Collab Playlists
                    </button>

                    <p className="library-label">Discover</p>

                    <button
                        type="button"
                        className={`library-item ${sidebarActive("moods")}`}
                        onClick={() => {
                            setSelectedMood(null);
                            openView("moods");
                        }}
                    >
                        <span>◐</span> Moods
                    </button>

                    <button
                        type="button"
                        className={`library-item ${sidebarActive("recommendations")}`}
                        onClick={() => openView("recommendations")}
                    >
                        <span>✦</span> For You
                    </button>

                    <button
                        type="button"
                        className={`library-item ${sidebarActive("generate")}`}
                        onClick={() => openView("generate")}
                    >
                        <span>ϟ</span> Playlist Generator
                    </button>

                    <button
                        type="button"
                        className={`library-item ${sidebarActive("story")}`}
                        onClick={() => openView("story")}
                    >
                        <span>✎</span> StorySong
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
                    {library.notice && (
                        <p className="dashboard-notice" role="alert">
                            {library.notice}
                        </p>
                    )}

                    {activeView === "home" && (
                        <HomeDiscovery
                            songs={songs}
                            songsLoading={songsLoading}
                            songsError={songsError}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                            onOpenSong={openSong}
                            onSelectMood={openMood}
                            onOpenMoods={() => {
                                setSelectedMood(null);
                                openView("moods");
                            }}
                            onOpenForYou={() => openView("recommendations")}
                            onOpenCreate={() => openView("create")}
                        />
                    )}

                    {activeView === "moods" && (
                        <Moods
                            mood={selectedMood}
                            onSelectMood={openMood}
                            onOpenSong={openSong}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                        />
                    )}

                    {activeView === "search" && (
                        <Search
                            key={searchQuery}
                            initialQuery={searchQuery}
                            onOpenSong={openSong}
                            onSelectMood={openMood}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                        />
                    )}

                    {activeView === "recommendations" && (
                        <Recommendations
                            onOpenSong={openSong}
                            onPickMood={() => {
                                setSelectedMood(null);
                                openView("moods");
                            }}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                        />
                    )}

                    {activeView === "song" && selectedSongId !== null && (
                        <SongDetails
                            key={selectedSongId}
                            songId={selectedSongId}
                            playlists={library.playlists}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                            onOpenSong={openSong}
                            onBack={() => openView(songBackView)}
                            onPlaylistChanged={library.refreshPlaylists}
                        />
                    )}

                    {activeView === "liked" && (
                        <LikedSongs
                            likedItems={library.likedItems}
                            songs={songs}
                            onToggleLike={library.toggleLike}
                            onOpenSong={openSong}
                        />
                    )}

                    {activeView === "playlists" && (
                        <MyPlaylists
                            playlists={library.playlists}
                            loading={library.libraryLoading}
                            onSelectPlaylist={openPlaylist}
                            onCreate={() => openView("create")}
                            onGenerate={() => openView("generate")}
                        />
                    )}

                    {activeView === "create" && (
                        <CreatePlaylist
                            songs={songs}
                            onCreatePlaylist={handleCreatePlaylist}
                        />
                    )}

                    {activeView === "generate" && (
                        <PlaylistGenerator
                            onGenerated={library.refreshPlaylists}
                            onOpenPlaylist={openPlaylist}
                            onOpenSong={openSong}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                        />
                    )}

                    {activeView === "story" && (
                        <StorySong
                            onOpenSong={openSong}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                        />
                    )}

                    {activeView === "playlist-details" && selectedPlaylistId !== null && (
                        <PlaylistDetails
                            key={selectedPlaylistId}
                            playlistId={selectedPlaylistId}
                            onBack={() => openView("playlists")}
                            onChanged={library.refreshPlaylists}
                            onDeleted={() => openView("playlists")}
                            onOpenSong={openSong}
                            isLiked={library.isLiked}
                            onToggleLike={library.toggleLike}
                        />
                    )}

                    {activeView === "profile" && (
                        <Profile
                            playlists={library.playlists}
                            onSelectPlaylist={openPlaylist}
                        />
                    )}

                    <Footer showCTA={false} />
                </main>
            </div>
        </div>
    );
}

export default Home;
