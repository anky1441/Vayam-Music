
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LikedSongs from "./dashboard/LikedSongs.jsx";
import MyPlaylists from "./dashboard/MyPlaylists.jsx";
import CreatePlaylist from "./dashboard/CreatePlaylists.jsx";
import Profile from "./dashboard/Profile.jsx";
import "./Home.css";
import "./dashboard/DashboardContent.css";

const sampleSongs = [
    { id: "song-1", title: "Midnight Dreams", artist: "Vayam Mix", art: "dashboard-song-art-one" },
    { id: "song-2", title: "Electric Heart", artist: "Vayam Mix", art: "dashboard-song-art-two" },
    { id: "song-3", title: "Quiet Moments", artist: "Vayam Mix", art: "dashboard-song-art-three" },
    { id: "song-4", title: "After Hours", artist: "Vayam Mix", art: "dashboard-song-art-four" },
];

function HomeDiscovery({ onLike, likedSongs }) {
    return (
        <>
            <section className="music-welcome">
                <p className="music-eyebrow">YOUR MUSIC, YOUR MOOD</p>
                <h1>Good music. Better moods.</h1>
                <p>Find the sounds that match your moment.</p>
            </section>

            <section className="music-section">
                <h2>Explore Your Mood</h2>
                <div className="mood-grid">
                    <div className="mood-card mood-chill"><span>☾</span><h3>Chill Vibes</h3></div>
                    <div className="mood-card mood-energy"><span>ϟ</span><h3>Energy Boost</h3></div>
                    <div className="mood-card mood-romantic"><span>♡</span><h3>Romantic</h3></div>
                    <div className="mood-card mood-focus"><span>✦</span><h3>Deep Focus</h3></div>
                </div>
            </section>

            <section className="music-section">
                <div className="music-section-heading">
                    <h2>Trending Songs</h2>
                    <span>Discover more →</span>
                </div>
                <div className="song-grid">
                    {sampleSongs.map((song) => (
                        <article className="song-card" key={song.id}>
                            <div className={`song-art ${song.art.replace("dashboard-song-art-", "song-art-")}`}>
                                ♫
                            </div>
                            <h3>{song.title}</h3>
                            <p>{song.artist}</p>
                            <button
                                type="button"
                                className={`dashboard-heart ${likedSongs.includes(song.id) ? "liked" : ""}`}
                                onClick={() => onLike(song.id)}
                                aria-label={`Like ${song.title}`}
                            >
                                {likedSongs.includes(song.id) ? "♥" : "♡"}
                            </button>
                        </article>
                    ))}
                </div>
            </section>

            <section className="music-section">
                <div className="music-section-heading"><h2>Explore by Genre</h2></div>
                <div className="genre-list">
                    <div>Pop</div><div>Indie</div><div>Lo-fi</div>
                    <div>Classical</div><div>Rock</div><div>Instrumental</div>
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
    const playlistSongs = songs.filter((song) => playlist.songs.includes(song.id));

    return (
        <section className="dashboard-view">
            <button className="dashboard-add-button" onClick={onBack}>← My Playlists</button>
            <p className="dashboard-eyebrow" style={{ marginTop: 24 }}>YOUR PLAYLIST</p>
            <h1>{playlist.name}</h1>
            <p className="dashboard-subtitle">
                {playlist.description || "Your personal music collection"} · {playlistSongs.length} songs
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
                        <div className="dashboard-song" key={song.id}>
                            <div className={`dashboard-song-art ${song.art}`}>♫</div>
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

function Home() {
    const [activeView, setActiveView] = useState("home");
    const [songs] = useState(sampleSongs);
    const [likedSongs, setLikedSongs] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("vayam-liked-songs")) || [];
        } catch {
            return [];
        }
    });
    const [playlists, setPlaylists] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("vayam-playlists")) || [];
        } catch {
            return [];
        }
    });
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

    useEffect(() => {
        localStorage.setItem("vayam-liked-songs", JSON.stringify(likedSongs));
    }, [likedSongs]);

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
           {/* <Navbar onProfileClick={() => openView("profile")} /> */}
           <Navbar />

            <div className="music-home-layout">
                <aside className="music-sidebar">
                    <div className="library-heading">
                        <span className="library-icon">♫</span>
                        <h2>Your Library</h2>
                    </div>

                    <button
                        className={`library-item ${activeView === "liked" ? "active" : ""}`}
                        onClick={() => openView("liked")}
                    >
                        <span>♡</span> Liked Songs
                    </button>

                    <button
                        className={`library-item ${activeView === "playlists" || activeView === "playlist-details" ? "active" : ""}`}
                        onClick={() => openView("playlists")}
                    >
                        <span>☷</span> My Playlists
                    </button>

                    <div className="create-playlist-box">
                        <span className="create-playlist-icon">＋</span>
                        <h3>Create Playlist</h3>
                        <p>Create a collection of your favourite songs.</p>
                        <button
                            className="create-playlist-button"
                            onClick={() => openView("create")}
                        >
                            Create Playlist
                        </button>
                    </div>
                </aside>

                <main className="music-content">
                    {activeView === "home" && (
                        <HomeDiscovery onLike={toggleLike} likedSongs={likedSongs} />
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

                    {activeView === "profile" && (
                        <Profile playlists={playlists} />
                    )}

                    <Footer showCTA={false} />
                </main>
            </div>
        </div>
    );
}

export default Home;
