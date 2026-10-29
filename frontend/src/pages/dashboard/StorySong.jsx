import { useState, useRef } from "react";
import { usePlayer } from "../../context/PlayerContext";
import { matchStorySong } from "../../api/musicApi";
import "./StorySong.css";

const PRESET_VIBES = [
  {
    id: "midnight",
    label: "🌙 Midnight highway drive with neon city lights",
    text: "Midnight highway drive with neon city lights",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800",
  },
  {
    id: "rainy",
    label: "☕ Rainy Sunday morning in a warm cozy cafe",
    text: "Rainy Sunday morning in a warm cozy cafe",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  },
  {
    id: "sunset",
    label: "🌅 Golden hour sunset on a peaceful ocean cliff",
    text: "Golden hour sunset on a peaceful ocean cliff",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  },
  {
    id: "gym",
    label: "⚡ High-energy focus gym session with synth rhythm",
    text: "High-energy focus gym session with synth rhythm",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
  },
  {
    id: "forest",
    label: "🍃 Peaceful walk in a foggy pine forest",
    text: "Peaceful walk in a foggy pine forest",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
  },
  {
    id: "nostalgic",
    label: "✨ Nostalgic summer memories with friends",
    text: "Nostalgic summer memories with friends",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
  },
];

export default function StorySong({ onPlaySong }) {
  const { currentSong, playSong } = usePlayer();
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
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
    setSelectedPreset(null);
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
    setSelectedPreset(null);
    if (imagePreview) {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Select one of the curated aesthetic vibe presets
  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setVibeText(preset.text);
    setImagePreview(preset.image);
    setError("");
  };

  // Submit to ML StorySong API
  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!imageFile && !imagePreview && !vibeText.trim()) {
      setError("Please select a preset vibe or upload an image to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setAtmosphere(null);
    setRecommendations([]);

    // Multi-stage status feedback
    setStatusText("Analyzing visual aesthetics & emotional vibe...");
    const timer1 = setTimeout(() => {
      setStatusText("Synthesizing musical valence & energy coordinates...");
    }, 1200);

    const timer2 = setTimeout(() => {
      setStatusText("Scanning Spotify 114k catalog for the perfect musical matches...");
    }, 2400);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append("file", imageFile);
      }
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
          "Unable to analyze atmosphere or connect to ML backend. Please ensure the ML service is running."
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

  const canSubmit = Boolean(imageFile || imagePreview || vibeText.trim());

  return (
    <div className="storysong-view">
      <div className="storysong-header">
        <span className="storysong-badge">✨ Feature 4 · Vision AI</span>
        <h1>AI StorySong Studio</h1>
        <p>
          Upload any photo or pick a curated aesthetic vibe below. Our Vision AI
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
              onChange={(e) => {
                setVibeText(e.target.value);
                setSelectedPreset(null);
              }}
            />

            <div className="storysong-presets">
              {PRESET_VIBES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`storysong-chip ${selectedPreset === preset.id ? "active" : ""}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset.label}
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
              disabled={loading || !canSubmit}
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
              Upload a picture or select any of the curated vibe presets above and click <strong>Generate Soundtrack</strong> to
              extract the emotional coordinates and explore matching songs.
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
