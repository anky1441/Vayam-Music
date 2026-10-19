
import "./DashboardContent.css";

function MyPlaylists({ playlists, onSelectPlaylist }) {
  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">YOUR COLLECTION</p>
      <h1>My Playlists</h1>
      <p className="dashboard-subtitle">
        Your music, organised your way.
      </p>

      {playlists.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-big-icon">♫</span>
          <h2>Your playlists will appear here</h2>
          <p>Create your first playlist to get started.</p>
        </div>
      ) : (
        <div className="dashboard-playlist-grid">
          {playlists.map((playlist) => (
            <button
              className="dashboard-playlist-card"
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id)}
            >
              <div className="dashboard-playlist-art">♫</div>
              <h3>{playlist.name}</h3>
              <p>{playlist.songs.length} songs</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyPlaylists;
