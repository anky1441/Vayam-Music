import { useState } from "react";
import { getApiErrorMessage } from "../../api/api";
import { generatePlaylist } from "../../api/musicApi";
import SongRow from "../../components/SongRow";
import { MOODS } from "../../constants/moods";
import { toList, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

const SIZES = [10, 15, 20, 30];

// Playlist Generator: POST /playlists/generate
function PlaylistGenerator({ onGenerated, onOpenPlaylist, onOpenSong, isLiked, onToggleLike }) {
  const [mood, setMood] = useState("");
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!mood) {
      setError("Please pick a mood first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // ASSUMED request body - rename the fields here if your DTO differs.
      const response = await generatePlaylist({
        mood,
        name: name.trim() || undefined,
        limit,
      });

      const data = response.data ?? {};
      const playlist = data.playlist ?? data;
      const songs = toList(data.songs ?? playlist.songs).map(unwrapSong).filter((s) => s?.title);

      setResult({ playlist, songs });
      onGenerated?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not generate a playlist. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">LET VAYAM DO IT</p>
      <h1>Playlist Generator</h1>
      <p className="dashboard-subtitle">
        Pick a mood and we will build a playlist for you in one tap.
      </p>

      <form className="playlist-form" onSubmit={handleSubmit}>
        <label>How are you feeling?</label>
        <div className="chip-row">
          {MOODS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`chip ${mood === item.key ? "active" : ""}`}
              onClick={() => {
                setMood(item.key);
                setError("");
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <label htmlFor="gen-name">Playlist name (optional)</label>
        <input
          id="gen-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Sunday Reset"
          maxLength={60}
        />

        <label>Number of songs</label>
        <div className="chip-row">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`chip ${limit === size ? "active" : ""}`}
              onClick={() => setLimit(size)}
            >
              {size}
            </button>
          ))}
        </div>

        {error && <p className="dv-error" role="alert">{error}</p>}

        <button className="dashboard-primary-button" type="submit" disabled={loading}>
          {loading ? "Generating..." : "ϟ Generate playlist"}
        </button>
      </form>

      {result && (
        <div className="dv-result">
          <p className="dashboard-eyebrow">YOUR NEW PLAYLIST</p>
          <h2>{result.playlist.name || "Generated playlist"}</h2>
          <p className="dashboard-subtitle">
            {result.songs.length > 0
              ? `${result.songs.length} songs picked for your mood.`
              : "Your playlist has been created and saved."}
          </p>

          {result.songs.length > 0 && (
            <div className="dashboard-song-list">
              {result.songs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  liked={isLiked(song.id)}
                  onToggleLike={onToggleLike}
                  onOpen={onOpenSong}
                />
              ))}
            </div>
          )}

          {result.playlist.id !== undefined && (
            <div className="dv-actions">
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={() => onOpenPlaylist(result.playlist.id)}
              >
                Open playlist
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default PlaylistGenerator;
