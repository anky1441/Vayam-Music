import { useNavigate } from "react-router-dom";
import "./Footer.css";

function Footer({ showCTA = true }) {
  const navigate = useNavigate();
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <footer className="footer-section">
      {/* CTA: shown only when showCTA is true */}
      {showCTA && (
        <div className="footer-cta">
          <div className="footer-cta-glow"></div>

          <div className="footer-cta-content">
            <span className="footer-eyebrow">
              YOUR NEXT FAVOURITE SONG AWAITS
            </span>

            <h2>
              Every mood has a melody.
              <br />
              <span>Find yours with Vayam.</span>
            </h2>

            <p>
              Discover new sounds, create your vibe, and give
              every moment its own soundtrack.
            </p>

            <button
              className="footer-cta-button"
              onClick={() => navigate("/home")}
              type="button"
            >
              Explore Vayam <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="footer-decoration" aria-hidden="true">
            <span className="footer-note note-one">♪</span>
            <span className="footer-note note-two">♫</span>
            <span className="footer-note note-three">✦</span>
            <span className="footer-orbit orbit-one"></span>
            <span className="footer-orbit orbit-two"></span>
          </div>
        </div>
      )}

      {/* Footer Main */}
      <div className="footer-main">
        <div className="footer-brand">
          <button
            className="footer-logo"
            onClick={() => scrollToSection("home")}
            type="button"
            aria-label="Vayam Music home"
          >
            <span className="footer-logo-icon">♫</span>
            <span>
              vayam<span className="footer-logo-dot">.</span>
            </span>
          </button>

          <p>
            Your mood. Your music.
            <br />
            A soundtrack for every moment.
          </p>
        </div>

        <div className="footer-links-group">
          <h3>Explore</h3>
          <button onClick={() => scrollToSection("home")} type="button">
            Home
          </button>
          <button onClick={() => scrollToSection("features")} type="button">
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            type="button"
          >
            How It Works
          </button>
          
        </div>

        <div className="footer-links-group">
          <h3>Discover</h3>
          <button onClick={() => scrollToSection("moments")} type="button">
            Music Moments
          </button>
          <button onClick={() => scrollToSection("reviews")} type="button">
            Listener Experience
          </button>
          <button onClick={() => scrollToSection("faq")} type="button">
            FAQs
          </button>
          
        </div>

        <div className="footer-note-block">
          <span className="footer-note-label">MADE FOR YOUR MOMENTS</span>
          <p>
            Some moments need words.
            <br />
            Others just need music.
          </p>
          <span className="footer-mini-wave" aria-hidden="true">
            ▂ ▅ ▃ ▇ ▄ ▆ ▂ ▅ ▃
          </span>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Vayam Music. All rights reserved.
        </p>

        <span className="footer-bottom-tagline">
          Made with <span aria-label="love">♥</span> for music lovers
        </span>
      </div>
    </footer>
  );
}

export default Footer;
