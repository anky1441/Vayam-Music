
import "./DashboardContent.css";

function LikedSongs({ songs, likedSongs, onToggleLike }) {
  const liked = songs.filter((song) => likedSongs.includes(song.id));

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
            <div className="dashboard-song" key={song.id}>
              <div className={`dashboard-song-art ${song.art}`}>
                ♫
              </div>
              <div className="dashboard-song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
              </div>
              <button
                className="dashboard-heart liked"
                onClick={() => onToggleLike(song.id)}
                aria-label={`Unlike ${song.title}`}
              >
                ♥
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default LikedSongs;
