
import "./FeaturesSection.css";

const features = [
  {
    number: "01",
    icon: "♫",
    title: "Mood-Based Discovery",
    description:
      "From happy and energetic to calm and nostalgic, discover music that matches how you feel.",
    className: "feature-mood",
  },
  {
    number: "02",
    icon: "✳",
    title: "AI Music Recommendations",
    description:
      "Find your next favourite track through recommendations based on your music taste and song similarities.",
    className: "feature-ai",
  },
  {
    number: "03",
    icon: "▤",
    title: "AI Playlist Generator",
    description:
      "Create a playlist around your moment, whether it is a late-night drive, a workout, or a study session.",
    className: "feature-playlist",
  },
  {
    number: "04",
    icon: "▧",
    title: "StorySong",
    description:
      "Have a photo or a particular vibe in mind? Discover songs that fit its atmosphere.",
    className: "feature-story",
  },
  {
    number: "05",
    icon: "∞",
    title: "Collaborative Playlists",
    description:
      "Bring your friends together to build a shared soundtrack for trips, events, and memories.",
    className: "feature-social",
  },
];

function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="features-heading">
        <p className="features-eyebrow">
          MADE FOR YOUR MOMENTS
        </p>

        <h2>
          Everything You Need for a
          <span> Perfect Music Experience.</span>
        </h2>

        <p className="features-intro">
          Your mood, your taste, your moments.
          Discover a more personal way to experience music
          with Vayam.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <article
            className={`feature-card ${feature.className}`}
            key={feature.number}
          >
            <div className="feature-card-top">
              <span className="feature-icon">
                {feature.icon}
              </span>
              
            </div>

            <div className="feature-card-content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>

            <span className="feature-decoration" aria-hidden="true">
              ↗
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
