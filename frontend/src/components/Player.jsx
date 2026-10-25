import { usePlayer } from "../context/PlayerContext";
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
    } = usePlayer();

    if (!currentSong) return null; // Hidden until a song is picked

    return (
        <div className="player-bar">
            {/* Left: Track Info */}
            <div className="player-track">
                <div className="player-art">
                    {currentSong.coverUrl ? (
                        <img src={currentSong.coverUrl} alt={currentSong.title} />
                    ) : (
                        <span>♫</span>
                    )}
                </div>
                <div className="player-meta">
                    <span className="player-title">{currentSong.title}</span>
                    <span className="player-artist">{currentSong.artist}</span>
                </div>
            </div>

            {/* Center: Controls & Progress Bar */}
            <div className="player-center">
                <div className="player-buttons">
                    <button
                        type="button"
                        className="player-play-btn"
                        onClick={togglePlay}
                        disabled={isLoadingAudio}
                    >
                        {isLoadingAudio ? "⏳" : isPlaying ? "⏸" : "▶"}
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
                    />
                    <span className="player-time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right: Volume Control */}
            <div className="player-right">
                <span>{volume === 0 ? "🔇" : "🔊"}</span>
                <input
                    type="range"
                    className="player-volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                />
            </div>
        </div>
    );
}
