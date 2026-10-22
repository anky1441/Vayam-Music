
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ onProfileClick }) {
  const [search, setSearch] = useState("");

  return (
    <nav className="navbar">
      <a href="/home" className="navbar-brand">
        <img
          src="/images/vayam-icon.png"
          alt="Vayam logo"
          className="navbar-logo"
        />
        <span>Vayam</span>
      </a>

      <a
        href="/home"
        className="navbar-home"
        aria-label="Home"
        title="Home"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="navbar-home-icon"
        >
          <path
            d="M3 10.5 12 3l9 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      <form
        className="navbar-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (search.trim()) {
            console.log("Search:", search.trim());
          }
        }}
      >
        <button type="submit" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m16 16 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <input
          type="search"
          placeholder="Search music..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search music"
        />
      </form>

      {onProfileClick ? (
        <button
          type="button"
          className="navbar-login"
          onClick={onProfileClick}
        >
          Profile
        </button>
      ) : (
        <Link to="/login" className="navbar-login">
          Login
        </Link>
      )}
    </nav>
  );
}

export default Navbar;
