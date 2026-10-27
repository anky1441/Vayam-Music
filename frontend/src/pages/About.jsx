import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./About.css";

const features = [
  { icon: "🎧", title: "Mood-Based Discovery", text: "Pick how you feel (Happy, Relaxed, Energetic, Focused or Nostalgic) and get songs that match." },
  { icon: "✨", title: "Made For You", text: "Like a few songs and Vayam learns your taste, then suggests similar music you'll enjoy." },
  { icon: "🤖", title: "AI Playlist Generator", text: "Describe a moment like \"night drive\" or \"study session\" and get a playlist built for it." },
  { icon: "📷", title: "StorySong", text: "Upload a photo, choose its vibe, and find songs that fit the story it tells." },
  { icon: "👥", title: "Collaborative Playlists", text: "Build playlists together with friends. Everyone adds songs, everyone listens." },
];

const steps = [
  { n: "01", title: "Choose your moment", text: "Select a mood, type a prompt, or upload a photo." },
  { n: "02", title: "We find your sound", text: "Our recommendation engine matches songs by mood, genre and energy." },
  { n: "03", title: "Press play", text: "Listen, like, and save songs to playlists you can share." },
];

// TODO: put your real team names and roles here
const team = [
  { name: "Vanshika", role: "Frontend" },
  { name: "Mahek", role: "Backend" },
  { name: "Ankit", role: "ML" },
  { name: "Krish", role: "ML" },
];

export default function About() {
  const { hash } = useLocation();

  // Scroll to #features / #how-it-works when coming from the footer
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [hash]);

  return (
    <div className="about-page">
      <Navbar />
      <section className="about-hero">
        <span className="about-label">ABOUT VAYAM</span>
        <h1>Your mood. Your music.</h1>
        <p>
          Vayam is a music experience built around how you feel. Some moments need words,
          others just need music, and we help you find the right sound for each one.
        </p>
        <div className="about-bars" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </section>

      <section className="about-section about-mission">
        <h2>Why we built it</h2>
        <p>
          Most music apps start with a search box. We start with a feeling. Vayam turns your mood,
          a photo, or a few words into a soundtrack, so you spend less time searching and more
          time listening.
        </p>
      </section>

      <section id="features" className="about-section">
        <h2>Features</h2>
        <div className="about-grid">
          {features.map((f) => (
            <div key={f.title} className="about-card">
              <span className="about-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="about-section">
        <h2>How it works</h2>
        <div className="about-steps">
          {steps.map((s) => (
            <div key={s.n} className="about-step">
              <span className="about-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>The team</h2>
        <div className="about-team">
          {team.map((m, i) => (
            <div key={i} className="about-member">
              <div className="about-avatar">{m.name.charAt(0)}</div>
              <strong>{m.name}</strong>
              <span>{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <h2>Ready to find your sound?</h2>
        <Link to="/home" className="about-btn">Start listening</Link>
      </section>
    </div>
  );
}