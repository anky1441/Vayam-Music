import { useState, useRef } from "react";
import { usePlayer } from "../../context/PlayerContext";
import { matchStorySong } from "../../api/musicApi";
import "./StorySong.css";

const PRESET_VIBES = [
  "🌙 Midnight highway drive with neon city lights",
  "☕ Rainy Sunday morning in a warm cozy cafe",
  "🌅 Golden hour sunset on a peaceful ocean cliff",
  "⚡ High-energy focus gym session with synth rhythm",
  "🍃 Peaceful walk in a foggy pine forest",
  "✨ Nostalgic summer memories with friends",
];

export default function StorySong({ onPlaySong }) {
  const { currentSong, playSong } = usePlayer();
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [vibeText, setVibeText] = useState("");
  const [trackCount, setTrackCount] = useState(6);

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const [atmosphere, setAtmosphere] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Handle image upload from file picker or drag-and-drop
  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }
    setError("");
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit to ML StorySong API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please select or drop an image to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setAtmosphere(null);
    setRecommendations([]);

    // Multi-stage status feedback
    setStatusText("Analyzing image aesthetics & visual vibes with Vision AI...");
    const timer1 = setTimeout(() => {
      setStatusText("Extracting emotional valence and energy levels...");
    }, 1400);

    const timer2 = setTimeout(() => {
      setStatusText("Scanning Spotify 114k catalog for the perfect musical matches...");
    }, 2800);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("vibe", vibeText);
      formData.append("number", trackCount);

      const data = await matchStorySong(formData);

      if (data.atmosphere) {
        setAtmosphere(data.atmosphere);
      }
      if (Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error("StorySong error:", err);
      setError(
        err.message ||
          "Unable to analyze image or connect to ML backend. Please ensure the ML service is running."
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
      setStatusText("");
    }
  };

  const handlePlayTrack = (track) => {
    const title = track.track_name || track.title;
    const artist = track.artists || track.artist;
    const genre = track.track_genre || track.genre || "Pop";
    const coverUrl = track.coverUrl || track.cover_url || null;
    const audioUrl = track.audioUrl || track.audio_url || "";

    const songPayload = {
      id: track.id || `${title}_${artist}`,
      title,
      artist,
      genre,
      coverUrl,
      audioUrl,
    };

    const queueList = (recommendations || []).map((t) => {
      const tTitle = t.track_name || t.title;
      const tArtist = t.artists || t.artist;
      return {
        id: t.id || `${tTitle}_${tArtist}`,
        title: tTitle,
        artist: tArtist,
        genre: t.track_genre || t.genre || "Pop",
        coverUrl: t.coverUrl || t.cover_url || null,
        audioUrl: t.audioUrl || t.audio_url || "",
      };
    });

    if (onPlaySong) {
      onPlaySong(songPayload, queueList);
    } else {
      playSong(songPayload, queueList);
    }
  };

  return (
    <div className="storysong-view">
      <div className="storysong-header">
        <span className="storysong-badge">✨ Feature 4 · Vision AI</span>
        <h1>AI StorySong Studio</h1>
        <p>
          Upload any photo and describe your moment. Our Cloudflare Vision AI
          reads the emotion, calculates valence and energy coordinates, and
          curates an instant personalized soundtrack from over 114,000 tracks.
        </p>
      </div>

      <div className="storysong-workspace">
        {/* Left: Interactive Input Card */}
        <div className="storysong-input-card">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="storysong-file-input"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />

          {!imagePreview ? (
            <div
              className="storysong-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <span className="storysong-dropzone-icon">📷</span>
              <h3>Drop your image here</h3>
              <p>or click to browse from your device (PNG, JPG, WebP)</p>
            </div>
          ) : (
            <div className="storysong-preview-box">
              <img
                src={imagePreview}
                alt="Uploaded preview"
                className="storysong-preview-img"
              />
              <button
                type="button"
                className="storysong-remove-img"
                onClick={handleRemoveImage}
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          <div className="storysong-form-group">
            <label htmlFor="storysong-vibe">Your Vibe / Story (Optional)</label>
            <textarea
              id="storysong-vibe"
              className="storysong-textarea"
              placeholder="e.g. Late night thoughts, driving with the windows down..."
              value={vibeText}
              onChange={(e) => setVibeText(e.target.value)}
            />

            <div className="storysong-presets">
              {PRESET_VIBES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="storysong-chip"
                  onClick={() => setVibeText(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="storysong-controls-row">
            <div className="storysong-count-picker">
              <span>Tracks:</span>
              <select
                className="storysong-count-select"
                value={trackCount}
                onChange={(e) => setTrackCount(Number(e.target.value))}
              >
                <option value={5}>5 songs</option>
                <option value={8}>8 songs</option>
                <option value={12}>12 songs</option>
              </select>
            </div>

            <button
              type="button"
              className="storysong-submit-btn"
              disabled={loading || !imageFile}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <span className="storysong-spinner" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>✨ Generate Soundtrack</span>
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="storysong-status-box loading">
              <span className="storysong-spinner" />
              <span>{statusText}</span>
            </div>
          )}

          {error && (
            <div className="storysong-status-box error">
              <span>⚠️ {error}</span>
            </div>
          )}
        </div>

        {/* Right: Atmosphere & Emotional Coordinates Card */}
        {atmosphere ? (
          <div className="storysong-atmosphere-card">
            <h2>
              <span>🌌</span> Analyzed Atmosphere
            </h2>

            <blockquote className="storysong-story-quote">
              "{atmosphere.story || "Aesthetic vibe detected from visual context."}"
            </blockquote>

            <div className="storysong-meters">
              <div className="storysong-meter">
                <div className="storysong-meter-header">
                  <span className="storysong-meter-label">
                    Valence (Musical Positivity)
                  </span>
                  <span className="storysong-meter-value">
                    {Math.round((atmosphere.valence || 0) * 100)}%
                  </span>
                </div>
                <div className="storysong-progress-bg">
                  <div
                    className="storysong-progress-fill valence"
                    style={{
                      width: `${Math.round((atmosphere.valence || 0) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="storysong-meter">
                <div className="storysong-meter-header">
                  <span className="storysong-meter-label">
                    Energy (Intensity & Dynamics)
                  </span>
                  <span className="storysong-meter-value">
                    {Math.round((atmosphere.energy || 0) * 100)}%
                  </span>
                </div>
                <div className="storysong-progress-bg">
                  <div
                    className="storysong-progress-fill energy"
                    style={{
                      width: `${Math.round((atmosphere.energy || 0) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {atmosphere.suggested_genre && (
              <div className="storysong-meta-pill">
                <span>Suggested Genre:</span>
                <strong>{atmosphere.suggested_genre}</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="storysong-atmosphere-card" style={{ opacity: 0.65 }}>
            <h2>
              <span>🔮</span> Emotional Coordinates
            </h2>
            <p style={{ color: "#b9adc9", fontSize: 13, margin: 0 }}>
              Upload a picture and click <strong>Generate Soundtrack</strong> to
              extract the emotional DNA (Valence & Energy) and explore matching
              soundtracks.
            </p>
          </div>
        )}
      </div>

      {/* Recommendations Results Section */}
      {recommendations.length > 0 && (
        <section className="storysong-results-section">
          <div className="storysong-results-heading">
            <h2>Matched Soundtracks ({recommendations.length})</h2>
            <span>Curated based on acoustic proximity</span>
          </div>

          <div className="storysong-grid">
            {recommendations.map((track, idx) => {
              const title = track.track_name || track.title;
              const artist = track.artists || track.artist;
              const genre = track.track_genre || track.genre;
              const coverUrl = track.coverUrl || track.cover_url;
              const isCurrent = currentSong?.title === title;
              return (
                <article
                  key={track.id || idx}
                  className={`storysong-card ${isCurrent ? "playing" : ""}`}
                >
                  <div className="storysong-card-top">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="storysong-card-art"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="storysong-card-art">♫</div>
                    )}
                    <div className="storysong-card-info">
                      <h3 title={title}>{title}</h3>
                      <p title={artist}>{artist}</p>
                    </div>
                  </div>

                  <div className="storysong-card-tags">
                    {genre && (
                      <span className="storysong-genre-tag">
                        {genre}
                      </span>
                    )}
                    {typeof track.popularity === "number" && (
                      <span className="storysong-match-score">
                        ★ {track.popularity}% pop
                      </span>
                    )}
                  </div>

                  <div className="storysong-card-actions">
                    <button
                      type="button"
                      className="storysong-play-btn"
                      onClick={() => handlePlayTrack(track)}
                    >
                      {isCurrent ? "Playing ▶" : "▶ Play Now"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
