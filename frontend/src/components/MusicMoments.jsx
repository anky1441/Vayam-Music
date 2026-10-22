
import "./MusicMoments.css";

const albums = [
  {
    image: "/images/album-1.jpg",
    title: "Midnight Dreams",
    mood: "Late night",
    className: "moment-art-one",
  },
  {
    image: "/images/album-2.jpg",
    title: "Golden Hour",
    mood: "Feel the moment",
    className: "moment-art-two",
  },
  {
    image: "/images/album-3.jpg",
    title: "Lost in Sound",
    mood: "Just breathe",
    className: "moment-art-three",
  },
];

function MusicMoments() {
  return (
    <section className="music-moments" id="moments">
      <div className="moments-copy">
        <p className="moments-label">
          MUSIC THAT FEELS PERSONAL
        </p>

        <h2>
          Your Music.
          <span>Your Moments.</span>
        </h2>

        <p className="moments-description">
          Some moments are too special for just any song.
          Discover music that connects with your mood,
          your memories, and the moments that make you,
          you.
        </p>

        <a href="#how-it-works" className="moments-link">
          Discover your soundtrack
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="moments-artwork">
        <div className="artwork-glow" aria-hidden="true" />
        <div className="artwork-ring artwork-ring-one" aria-hidden="true" />
        <div className="artwork-ring artwork-ring-two" aria-hidden="true" />

        {albums.map((album) => (
          <article
            className={`moment-art ${album.className}`}
            key={album.title}
          >
            <img src={album.image} alt={album.title} />

            <div className="moment-art-caption">
              <span className="art-music-icon">♫</span>
              <div>
                <h3>{album.title}</h3>
                <p>{album.mood}</p>
              </div>
            </div>
          </article>
        ))}

        <div className="artwork-note artwork-note-top">
          <span>✦</span>
          Every mood has a melody
        </div>

        <div className="artwork-note artwork-note-bottom">
          <span>♫</span>
          Your moment, your music
        </div>
      </div>
    </section>
  );
}

export default MusicMoments;
