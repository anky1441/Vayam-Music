import { useEffect, useState } from "react";
import { getApiErrorMessage, isAuthenticated } from "../../api/api";
import {
  addSongToPlaylist,
  getSongById,
  getSongRecommendations,
} from "../../api/musicApi";
import SongCard from "../../components/SongCard";
import {
  formatDuration,
  getArtClass,
  getAudio,
  getCover,
  sameId,
  toList,
  unwrapSong,
} from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

// Song Details: GET /songs/{id}, GET /recommendations/song/{id},
// POST /playlists/{id}/songs/{songId}
function SongDetails({
  songId,
  playlists,
  isLiked,
  onToggleLike,
  onOpenSong,
  onBack,
  onPlaylistChanged,
}) {
  const [song, setSong] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [playlistId, setPlaylistId] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setAddMessage("");

      try {
        const response = await getSongById(songId);
        if (active) setSong(unwrapSong(response.data));
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Could not load this song."));
        return;
      } finally {
        if (active) setLoading(false);
      }

      // "More like this" is a bonus - failing here should not hide the song.
      try {
        const response = await getSongRecommendations(songId);
        if (active) setSimilar(toList(response.data).map(unwrapSong));
      } catch {
        if (active) setSimilar([]);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [songId]);

  async function handleAddToPlaylist() {
    if (!playlistId) return;
    setAdding(true);
    setAddMessage("");

    try {
      const isDatabaseId =
        (typeof playlistId === "number" ||
          (!isNaN(playlistId) && !String(playlistId).includes("-"))) &&
        String(playlistId).trim() !== "";

      if (isDatabaseId && isAuthenticated()) {
        await addSongToPlaylist(playlistId, songId);
      }

      try {
        const stored = JSON.parse(
          localStorage.getItem("vayam-playlists") || "[]"
        );
        const updated = stored.map((p) => {
          if (sameId(p.id, playlistId)) {
            const pSongs = Array.isArray(p.songs) ? p.songs : [];
            if (!pSongs.some((item) => sameId(item?.id ?? item, song.id))) {
              return { ...p, songs: [...pSongs, song] };
            }
          }
          return p;
        });
        localStorage.setItem("vayam-playlists", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }

      setAddMessage("Added to your playlist ✓");
      onPlaylistChanged?.();
    } catch (requestError) {
      setAddMessage(
        getApiErrorMessage(
          requestError,
          "Could not add this song to the playlist."
        )
      );
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <section className="dashboard-view">
        <button type="button" className="dashboard-add-button" onClick={onBack}>← Back</button>
        <p className="dashboard-subtitle" style={{ marginTop: 24 }}>Loading song...</p>
      </section>
    );
  }

  if (error || !song) {
    return (
      <section className="dashboard-view">
        <button type="button" className="dashboard-add-button" onClick={onBack}>← Back</button>
        <p className="dv-error" role="alert" style={{ marginTop: 24 }}>
          {error || "Song not found."}
        </p>
      </section>
    );
  }

  const cover = getCover(song);
  const audio = getAudio(song);
  const liked = isLiked(song.id);
  const facts = [
    ["Mood", song.mood],
    ["Genre", song.genre],
    ["Album", song.album],
    ["Duration", formatDuration(song.duration ?? song.durationSeconds)],
    ["Year", song.releaseYear ?? song.year],
  ].filter(([, value]) => value);

  return (
    <section className="dashboard-view">
      <button type="button" className="dashboard-add-button" onClick={onBack}>← Back</button>

      <div className="sd-hero">
        <div className={`sd-cover ${cover ? "" : getArtClass(song)}`}>
          {cover ? <img src={cover} alt={song.title} className="song-cover-image" /> : <span>♫</span>}
        </div>

        <div className="sd-info">
          <p className="dashboard-eyebrow">SONG</p>
          <h1>{song.title}</h1>
          <p className="sd-artist">{song.artist}</p>

          {facts.length > 0 && (
            <div className="sd-facts">
              {facts.map(([label, value]) => (
                <span key={label} className="sd-fact">
                  <small>{label}</small>
                  {value}
                </span>
              ))}
            </div>
          )}

          <div className="dv-actions">
            <button
              type="button"
              className={`dashboard-primary-button sd-like ${liked ? "liked" : ""}`}
              onClick={() => onToggleLike(song)}
              aria-pressed={liked}
            >
              {liked ? "♥ Liked" : "♡ Like"}
            </button>
          </div>
        </div>
      </div>

      {audio ? (
        <audio className="sd-audio" controls preload="none" src={audio}>
          Your browser does not support audio playback.
        </audio>
      ) : (
        <p className="dv-note">No audio file is linked to this song yet.</p>
      )}

      <div className="dv-panel">
        <h2>Add to playlist</h2>
        {playlists.length === 0 ? (
          <p className="dashboard-subtitle">You have no playlists yet. Create one from the sidebar.</p>
        ) : (
          <div className="dv-inline-form">
            <select
              className="dv-input"
              value={playlistId}
              onChange={(event) => {
                setPlaylistId(event.target.value);
                setAddMessage("");
              }}
              aria-label="Choose a playlist"
            >
              <option value="">Choose a playlist</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name || playlist.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="dashboard-primary-button"
              onClick={handleAddToPlaylist}
              disabled={!playlistId || adding}
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        )}
        {addMessage && <p className="dv-note" role="status">{addMessage}</p>}
      </div>

      {similar.length > 0 && (
        <div className="dv-block">
          <h2 className="dv-heading">More like this</h2>
          <div className="song-grid">
            {similar.map((item) => (
              <SongCard
                key={item.id}
                song={item}
                liked={isLiked(item.id)}
                onToggleLike={onToggleLike}
                onOpen={onOpenSong}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default SongDetails;
