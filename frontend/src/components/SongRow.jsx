import { formatDuration, getArtClass, getCover } from "../utils/music";

// Horizontal row used in lists (liked songs, search, playlists...).
// `children` renders extra buttons on the right (add, remove...).
function SongRow({ song, liked, onToggleLike, onOpen, children }) {
  const cover = getCover(song);
  const details = [song.mood, song.genre, formatDuration(song.duration ?? song.durationSeconds)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="dashboard-song">
      <button
        type="button"
        className="song-row-main"
        onClick={() => onOpen?.(song)}
        disabled={!onOpen}
      >
        <span className={`dashboard-song-art ${cover ? "" : getArtClass(song)}`}>
          {cover ? (
            <img src={cover} alt="" className="song-cover-image" />
          ) : (
            "♫"
          )}
        </span>

        <span className="dashboard-song-info">
          <h3>{song.title}</h3>
          <p>{song.artist}{details ? ` · ${details}` : ""}</p>
        </span>
      </button>

      {children}

      {onToggleLike && (
        <button
          type="button"
          className={`dashboard-heart ${liked ? "liked" : ""}`}
          onClick={() => onToggleLike(song)}
          aria-label={`${liked ? "Unlike" : "Like"} ${song.title}`}
          aria-pressed={liked}
        >
          {liked ? "♥" : "♡"}
        </button>
      )}
    </div>
  );
}

export default SongRow;
