import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../api/api";
import { getRecommendations } from "../../api/musicApi";
import SongCard from "../../components/SongCard";
import { toList, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

// "For You": GET /recommendations (personalised by the ML service)
function Recommendations({ onOpenSong, isLiked, onToggleLike, onPickMood }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getRecommendations();
      setSongs(toList(response.data).map(unwrapSong));
    } catch (requestError) {
      setSongs([]);
      setError(getApiErrorMessage(requestError, "Could not load your recommendations."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">MADE FOR YOU</p>
      <h1>Recommended for you</h1>
      <p className="dashboard-subtitle">
        Picked from the songs you like and the moods you listen to.
      </p>

      <div className="dv-actions">
        <button type="button" className="dashboard-add-button" onClick={load} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="song-grid">
          {[1, 2, 3, 4].map((n) => <div key={n} className="dv-skeleton" />)}
        </div>
      ) : error ? (
        <p className="dv-error" role="alert">{error}</p>
      ) : songs.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-big-icon">✦</span>
          <h2>No recommendations yet</h2>
          <p>Like a few songs or explore a mood and they will show up here.</p>
          <div className="dv-actions dv-actions-center">
            <button type="button" className="dashboard-primary-button" onClick={onPickMood}>
              Pick a mood
            </button>
          </div>
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

export default Recommendations;
