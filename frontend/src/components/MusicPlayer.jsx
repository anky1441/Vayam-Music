
import { useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";

export default function MusicPlayer({ song, onClose }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song?.audioUrl) return;

    setIsPlaying(false);
    setError("");
    audio.load();
  }, [song?.id, song?.audioUrl]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        setError("");
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
        setError("This audio could not be played. Try another track.");
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  if (!song) return null;

  return (
    <div className="music-player">
      <img
        className="music-player-cover"
        src={song.coverUrl || song.coverImage}
        alt={song.title}
      />

      <div className="music-player-info">
        <strong>{song.title}</strong>
        <span>{song.artist || "Unknown artist"}</span>
        {error && <small className="music-player-error">{error}</small>}
      </div>

      <button
        type="button"
        className="music-player-button"
        onClick={handlePlay}
        aria-label={isPlaying ? "Pause song" : "Play song"}
      >
        {isPlaying ? "Ⅱ" : "▶"}
      </button>

      <audio
        ref={audioRef}
        src={song.audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          setError("Audio unavailable. Please try another track.");
        }}
      />

      <button
        type="button"
        className="music-player-close"
        onClick={onClose}
        aria-label="Close player"
      >
        ×
      </button>
    </div>
  );
}
