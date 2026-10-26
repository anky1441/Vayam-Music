import { getPlaylistSongCount } from "../../utils/music";
import "./DashboardContent.css";

function MyPlaylists({ playlists, loading, onSelectPlaylist, onCreate, onGenerate }) {
  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">YOUR COLLECTION</p>
      <h1>My Playlists</h1>
      <p className="dashboard-subtitle">
        Your music, organised your way.
      </p>

      {loading ? (
        <p className="dashboard-subtitle">Loading your playlists...</p>
      ) : playlists.length === 0 ? (
        <div className="dashboard-empty">
          <span className="dashboard-big-icon">♫</span>
          <h2>Your playlists will appear here</h2>
          <p>Create your first playlist to get started.</p>
          <div className="dv-actions dv-actions-center">
            <button type="button" className="dashboard-primary-button" onClick={onCreate}>
              Create playlist
            </button>
            <button type="button" className="dashboard-add-button" onClick={onGenerate}>
              Generate by mood
            </button>
          </div>
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
              <h3>{playlist.name || playlist.title || "Untitled playlist"}</h3>
              <p>{getPlaylistSongCount(playlist)} songs</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyPlaylists;
