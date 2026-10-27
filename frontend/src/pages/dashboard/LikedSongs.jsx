import SongRow from "../../components/SongRow";
import { getSongId, sameId, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";

// `likedItems` or `likedSongs` comes from parent. If the backend only returns
// { songId } records or IDs, the full song is looked up in the `songs` list.
function LikedSongs({ likedItems, likedSongs, songs = [], onToggleLike, onOpenSong, onPlaySong }) {
  const rawItems = Array.isArray(likedItems)
    ? likedItems
    : Array.isArray(likedSongs)
    ? likedSongs
    : [];
  const songList = Array.isArray(songs) ? songs : [];

  const liked = rawItems
    .map((item) => {
      if (!item) return null;
      if (typeof item === "object" && item.title) return item;
      const id = typeof item === "object" ? getSongId(item) : item;
      const found = songList.find(
        (candidate) => sameId(candidate.id, id) || String(candidate.id) === String(id)
      );
      if (found) return found;
      return typeof item === "object" ? item : null;
    })
    .filter(Boolean);

  const handlePlay = onPlaySong || onOpenSong;

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">YOUR COLLECTION</p>
      <h1>Liked Songs</h1>
      <p className="dashboard-subtitle">
        All the songs you love, in one place.
      </p>

      {liked.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-big-icon">♡</span>
          <h2>No liked songs yet</h2>
          <p>Tap the heart on a song to save it here.</p>
        </div>
      ) : (
        <div className="dashboard-song-list">
          {liked.map((song) => (
            <SongRow
              key={song.id || song._id || song.title}
              song={song}
              liked
              onToggleLike={() => onToggleLike?.(song.id || song._id)}
              onOpen={handlePlay ? () => handlePlay(song) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default LikedSongs;
