import { getArtClass, getCover } from "../utils/music";

// Square card used in grids (trending, recommendations, mood results...).
function SongCard({ song, liked, onToggleLike, onOpen }) {
  const cover = getCover(song);

  return (
    <article
      className="song-card song-card-clickable"
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(song)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(song);
        }
      }}
    >
      <div className={`song-art ${cover ? "" : getArtClass(song)}`}>
        {cover ? (
          <img src={cover} alt={song.title} className="song-cover-image" />
        ) : (
          <span>♫</span>
        )}
      </div>

      <h3>{song.title}</h3>
      <p>{song.artist}</p>

      {onToggleLike && (
        <button
          type="button"
          className={`dashboard-heart card-heart ${liked ? "liked" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleLike(song);
          }}
          aria-label={`${liked ? "Unlike" : "Like"} ${song.title}`}
          aria-pressed={liked}
        >
          {liked ? "♥" : "♡"}
        </button>
      )}
    </article>
  );
}

export default SongCard;
