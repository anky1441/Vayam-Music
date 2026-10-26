import SongRow from "../../components/SongRow";
import { getSongId, sameId, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";

// `likedItems` comes from GET /users/me/likes. If the backend only returns
// { songId } records, the full song is looked up in the `songs` list.
function LikedSongs({ likedItems, songs, onToggleLike, onOpenSong }) {
  const liked = likedItems
    .map((item) => {
      const song = unwrapSong(item);
      if (song?.title) return song;
      return songs.find((candidate) => sameId(candidate.id, getSongId(item)));
    })
    .filter(Boolean);

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
              key={song.id}
              song={song}
              liked
              onToggleLike={onToggleLike}
              onOpen={onOpenSong}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default LikedSongs;
