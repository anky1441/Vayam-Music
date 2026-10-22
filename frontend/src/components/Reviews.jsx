
import "./Reviews.css";

const reviews = [
  {
    initial: "S",
    name: "Sample Listener 01",
    tag: "Mood Discovery",
    quote:
      "Finding music for a particular mood feels effortless. It makes discovering new songs more personal.",
  },
  {
    initial: "A",
    name: "Sample Listener 02",
    tag: "AI Playlists",
    quote:
      "The idea of creating a playlist from a simple prompt makes the whole music experience feel exciting.",
  },
  {
    initial: "R",
    name: "Sample Listener 03",
    tag: "Music Sharing",
    quote:
      "A space where music matches your moments and playlists can bring people together sounds amazing.",
  },
];

function Reviews() {
  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <div className="reviews-heading">
          <span className="reviews-eyebrow">
            THE VAYAM EXPERIENCE
          </span>

          <h2>
            Music is personal.
            <br />
            <span>So is the experience.</span>
          </h2>

          <p>
            Discover what a more personal music experience could feel like.
          </p>
        </div>

        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <article
              className="review-card"
              key={review.initial}
              style={{ "--card-index": index }}
            >
              <div className="review-card-top">
                <span className="review-quote-mark">“</span>
                <span className="review-tag">{review.tag}</span>
              </div>

              <p className="review-text">{review.quote}</p>

              <div className="review-divider"></div>

              <div className="review-author">
                <div className="review-avatar">{review.initial}</div>

                <div className="review-author-info">
                  <h3>{review.name}</h3>
                  <span>Demo content</span>
                </div>

                <span className="review-sparkle" aria-hidden="true">
                  ✦
                </span>
              </div>
            </article>
          ))}
        </div>

        <p className="reviews-disclaimer">
          Preview testimonials · Sample content, not actual user reviews
        </p>
      </div>
    </section>
  );
}

export default Reviews;
