import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../api/api";
import { searchSongs } from "../../api/musicApi";
import SongRow from "../../components/SongRow";
import { MOODS } from "../../constants/moods";
import { toList, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

// Search page: GET /songs/search?query=...  (debounced while typing)
function Search({ initialQuery, onOpenSong, onSelectMood, isLiked, onToggleLike }) {
  const [text, setText] = useState(initialQuery || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = text.trim();

  useEffect(() => {
    if (!query) return undefined;
    let active = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await searchSongs(query);
        if (active) setResults(toList(response.data).map(unwrapSong));
      } catch (requestError) {
        if (active) {
          setResults([]);
          setError(getApiErrorMessage(requestError, "Search failed. Please try again."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const shown = query ? results : [];

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">FIND YOUR SOUND</p>
      <h1>Search</h1>
      <p className="dashboard-subtitle">Look up songs, artists or albums.</p>

      <input
        className="dv-input dv-search"
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search songs or artists..."
        aria-label="Search songs or artists"
        autoFocus
      />

      {!query ? (
        <div className="dv-block">
          <p className="dashboard-subtitle">Not sure what to look for? Start with a mood.</p>
          <div className="chip-row">
            {MOODS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="chip"
                onClick={() => onSelectMood(item.key)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <p className="dashboard-subtitle">Searching...</p>
      ) : error ? (
        <p className="dv-error" role="alert">{error}</p>
      ) : shown.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-big-icon">⌕</span>
          <h2>No results for "{query}"</h2>
          <p>Check the spelling or try a different word.</p>
        </div>
      ) : (
        <>
          <p className="dashboard-subtitle">{shown.length} result(s) for "{query}"</p>
          <div className="dashboard-song-list">
            {shown.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                liked={isLiked(song.id)}
                onToggleLike={onToggleLike}
                onOpen={onOpenSong}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Search;
