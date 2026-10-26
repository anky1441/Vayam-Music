import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../api/api";
import { getMoodRecommendations, getSongsByMood } from "../../api/musicApi";
import SongCard from "../../components/SongCard";
import { MOODS, getMood } from "../../constants/moods";
import { toList, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

// Mood Selection page. With no mood chosen it shows the mood picker;
// once a mood is chosen it shows songs for that mood.
function Moods({ mood, onSelectMood, onOpenSong, isLiked, onToggleLike }) {
  const [mode, setMode] = useState("recommended"); // recommended | all
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!mood) return undefined;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setNote("");

      try {
        let list = [];

        if (mode === "recommended") {
          const response = await getMoodRecommendations(mood);
          list = toList(response.data).map(unwrapSong);
        }

        if (list.length === 0) {
          const response = await getSongsByMood(mood);
          list = toList(response.data).map(unwrapSong);
          if (mode === "recommended" && list.length > 0 && active) {
            setNote("No curated picks yet, so here are all songs for this mood.");
          }
        }

        if (active) setSongs(list);
      } catch (requestError) {
        if (active) {
          setSongs([]);
          setError(getApiErrorMessage(requestError, "Could not load songs for this mood."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [mood, mode]);

  const current = getMood(mood);

  if (!mood) {
    return (
      <section className="dashboard-view">
        <p className="dashboard-eyebrow">HOW ARE YOU FEELING?</p>
        <h1>Pick your mood</h1>
        <p className="dashboard-subtitle">
          Choose a mood and Vayam will find the songs that match it.
        </p>

        <div className="mood-picker">
          {MOODS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="mood-tile"
              style={{ "--mood-from": item.from, "--mood-to": item.to }}
              onClick={() => onSelectMood(item.key)}
            >
              <span className="mood-tile-icon">{item.icon}</span>
              <span className="mood-tile-name">{item.label}</span>
              <span className="mood-tile-tagline">{item.tagline}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">MOOD</p>
      <h1>{current ? `${current.icon} ${current.label}` : mood}</h1>
      <p className="dashboard-subtitle">
        {current?.tagline || "Songs picked for how you feel."}
      </p>

      <div className="chip-row" role="tablist" aria-label="Choose a mood">
        {MOODS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`chip ${item.key === mood ? "active" : ""}`}
            onClick={() => onSelectMood(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="dv-toggle" role="group" aria-label="Song list type">
        <button
          type="button"
          className={mode === "recommended" ? "active" : ""}
          onClick={() => setMode("recommended")}
        >
          Recommended
        </button>
        <button
          type="button"
          className={mode === "all" ? "active" : ""}
          onClick={() => setMode("all")}
        >
          All songs
        </button>
      </div>

      {note && <p className="dv-note">{note}</p>}

      {loading ? (
        <div className="song-grid">
          {[1, 2, 3, 4].map((n) => <div key={n} className="dv-skeleton" />)}
        </div>
      ) : error ? (
        <p className="dv-error" role="alert">{error}</p>
      ) : songs.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-big-icon">☾</span>
          <h2>No songs for this mood yet</h2>
          <p>Try another mood from the chips above.</p>
        </div>
      ) : (
        <div className="song-grid">
          {songs.map((song) => (
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
  );
}

export default Moods;
