import { useState, useRef, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { sameId } from "../utils/music";
import "./Player.css";

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function Player() {
    const {
        currentSong,
        isPlaying,
        isLoadingAudio,
        currentTime,
        duration,
        volume,
        togglePlay,
        seek,
        changeVolume,
        playNext,
        playPrevious,
        queue,
        queueIndex,
    } = usePlayer();

    const {
        isLiked,
        toggleLike,
        playlists,
        addSongToPlaylist,
        createPlaylist,
    } = useLibrary();

    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [playlistFeedback, setPlaylistFeedback] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const popoverRef = useRef(null);

    // Auto-close playlist modal when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                // If the click is on the playlist button itself, ignore (button toggle handles it)
                if (event.target.closest(".player-playlist-btn")) return;
                setShowPlaylistModal(false);
            }
        }

        if (showPlaylistModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPlaylistModal]);

    if (!currentSong) return null; // Hidden until a song is picked

    const liked = isLiked(currentSong);

    // Check if song is in a given playlist
    const isSongInPlaylist = (playlist) => {
        const pSongs = Array.isArray(playlist?.songs) ? playlist.songs : [];
        return pSongs.some((s) => {
            const sId = typeof s === "object" ? (s.id || s._id) : s;
            if (currentSong.id && sameId(sId, currentSong.id)) return true;
            if (currentSong.title && typeof s === "object" && s.title) {
                return (
                    s.title.trim().toLowerCase() === currentSong.title.trim().toLowerCase() &&
                    (!currentSong.artist || !s.artist || s.artist.trim().toLowerCase() === currentSong.artist.trim().toLowerCase())
                );
            }
            return false;
        });
    };

    // Handle adding to an existing playlist
    const handleAddToPlaylist = async (playlist) => {
        const result = await addSongToPlaylist(playlist.id, currentSong);
        if (result?.alreadyIn) {
            setPlaylistFeedback(`Already in "${result.playlistName}"`);
        } else if (result?.success) {
            setPlaylistFeedback(`Added to "${result.playlistName}" ✓`);
        } else {
            setPlaylistFeedback(result?.error || "Could not add to playlist");
        }
    };

    // Handle creating a new playlist and adding song immediately
    const handleCreateAndAdd = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        setIsCreating(true);
        try {
            const created = await createPlaylist({
                name: newPlaylistName.trim(),
                initialSong: currentSong,
            });
            if (created) {
                setPlaylistFeedback(`Created & added to "${created.name}" ✓`);
                setNewPlaylistName("");
            }
        } catch (err) {
            console.warn("Failed to create playlist:", err);
            setPlaylistFeedback("Failed to create playlist");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="player-bar">
            {/* Left: Track Info & Quick Actions */}
            <div className="player-track">
                <div className="player-art">
                    {currentSong.coverUrl ? (
                        <img src={currentSong.coverUrl} alt={currentSong.title} />
                    ) : (
                        <span>♫</span>
                    )}
                </div>
                <div className="player-meta">
                    <span className="player-title" title={currentSong.title}>
                        {currentSong.title}
                    </span>
                    <span className="player-artist" title={currentSong.artist}>
                        {currentSong.artist}
                    </span>
                </div>

                {/* Direct Action Buttons: Like & Add To Playlist */}
                <div className="player-actions">
                    <button
                        type="button"
                        className={`player-action-btn player-heart-btn ${liked ? "liked" : ""}`}
                        title={liked ? "Unlike song" : "Like song"}
                        onClick={() => toggleLike(currentSong)}
                        aria-label={liked ? "Unlike song" : "Like song"}
                    >
                        {liked ? "♥" : "♡"}
                    </button>

                    <button
                        type="button"
                        className={`player-action-btn player-playlist-btn ${showPlaylistModal ? "active" : ""}`}
                        title="Add to playlist"
                        onClick={() => {
                            setShowPlaylistModal((prev) => !prev);
                            setPlaylistFeedback("");
                        }}
                        aria-label="Add to playlist"
                    >
                        ＋
                    </button>
                </div>
            </div>

            {/* Center: Controls (Reverse, Play/Pause, Next) & Progress Bar */}
            <div className="player-center">
                <div className="player-buttons">
                    {/* Reverse / Previous button */}
                    <button
                        type="button"
                        className="player-ctrl-btn player-prev-btn"
                        title="Previous / Replay (⏮)"
                        onClick={playPrevious}
                        disabled={isLoadingAudio}
                        aria-label="Previous or replay track"
                    >
                        ⏮
                    </button>

                    {/* Play / Pause button */}
                    <button
                        type="button"
                        className="player-play-btn"
                        onClick={togglePlay}
                        disabled={isLoadingAudio}
                        title={isPlaying ? "Pause" : "Play"}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isLoadingAudio ? "⏳" : isPlaying ? "⏸" : "▶"}
                    </button>

                    {/* Next button */}
                    <button
                        type="button"
                        className="player-ctrl-btn player-next-btn"
                        title="Next Track (⏭)"
                        onClick={playNext}
                        disabled={isLoadingAudio}
                        aria-label="Next track"
                    >
                        ⏭
                    </button>
                </div>

                <div className="player-progress-container">
                    <span className="player-time">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        className="player-slider"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        aria-label="Track progress slider"
                    />
                    <span className="player-time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right: Queue position indicator & Volume Control */}
            <div className="player-right">
                {queue && queue.length > 1 && (
                    <span
                        className="player-queue-badge"
                        title={`Queue position: ${queueIndex + 1} of ${queue.length}`}
                    >
                        {queueIndex + 1} / {queue.length}
                    </span>
                )}
                <span>{volume === 0 ? "🔇" : "🔊"}</span>
                <input
                    type="range"
                    className="player-volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    aria-label="Volume slider"
                />
            </div>

            {/* Floating Popover: Add to Playlist */}
            {showPlaylistModal && (
                <aside
                    className="player-playlist-popover"
                    ref={popoverRef}
                    aria-label="Add to playlist menu"
                >
                    <div className="player-popover-header">
                        <h4>Add to Playlist</h4>
                        <button
                            type="button"
                            className="player-popover-close"
                            onClick={() => setShowPlaylistModal(false)}
                            aria-label="Close menu"
                        >
                            ×
                        </button>
                    </div>

                    {playlistFeedback && (
                        <div className="player-popover-feedback">
                            {playlistFeedback}
                        </div>
                    )}

                    {/* Quick Create Playlist */}
                    <form className="player-popover-create" onSubmit={handleCreateAndAdd}>
                        <input
                            type="text"
                            placeholder="New playlist name..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            maxLength={40}
                        />
                        <button
                            type="submit"
                            disabled={!newPlaylistName.trim() || isCreating}
                        >
                            {isCreating ? "..." : "+ Create"}
                        </button>
                    </form>

                    {/* Existing Playlists */}
                    <div className="player-popover-list">
                        {playlists.length === 0 ? (
                            <p className="player-popover-empty">
                                No playlists yet. Create one above!
                            </p>
                        ) : (
                            playlists.map((pl) => {
                                const inPlaylist = isSongInPlaylist(pl);
                                const count = Array.isArray(pl.songs) ? pl.songs.length : 0;
                                return (
                                    <button
                                        key={pl.id}
                                        type="button"
                                        className={`player-popover-item ${inPlaylist ? "in-playlist" : ""}`}
                                        onClick={() => handleAddToPlaylist(pl)}
                                    >
                                        <div className="player-popover-item-info">
                                            <span className="player-popover-item-name">{pl.name}</span>
                                            <span className="player-popover-item-count">{count} {count === 1 ? "song" : "songs"}</span>
                                        </div>
                                        <span className="player-popover-item-action">
                                            {inPlaylist ? "✓ Added" : "+ Add"}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>
            )}
        </div>
    );
}
