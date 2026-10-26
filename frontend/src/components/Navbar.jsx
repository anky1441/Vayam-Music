
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../api/api";
import { getCurrentUser } from "../api/musicApi";

import "./Navbar.css";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Navbar({ onProfileClick, onHomeClick, onSearch }) {
  const [search, setSearch] = useState("");
  const [initial, setInitial] = useState("");
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  // Show the first letter of the user's name on the profile button.
  useEffect(() => {
    if (!loggedIn) return;
    let active = true;

    getCurrentUser()
      .then((response) => {
        const name = response.data?.name ?? response.data?.user?.name;
        if (active && name) setInitial(name.trim().charAt(0).toUpperCase());
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, [loggedIn]);

  const goHome = (event) => {
    event.preventDefault();
    if (onHomeClick) onHomeClick();
    navigate("/home");
  };

  const openProfile = () => {
    if (onProfileClick) {
      // Already on the Home page: open Profile in the right-side panel.
      onProfileClick();
    } else {
      // Anywhere else: go to Home and open the Profile panel.
      navigate("/home", { state: { view: "profile" } });
    }
  };

  return (
    <nav className="navbar">
      <a href="/home" className="navbar-brand" onClick={goHome}>
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
        onClick={goHome}
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
          const query = search.trim();
          if (!query) return;

          if (onSearch) {
            // Already on the Home page: show results in the main panel.
            onSearch(query);
          } else {
            // Anywhere else: go to Home and open the Search view.
            navigate("/home", { state: { view: "search", query } });
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

      {loggedIn ? (
        <button
          type="button"
          className="navbar-profile"
          onClick={openProfile}
          aria-label="Open your profile"
          title="Profile"
        >
          {initial || <ProfileIcon />}
        </button>
      ) : (
        <div className="navbar-auth">
          <Link to="/login" className="navbar-login">
            Login
          </Link>
          <Link to="/register" className="navbar-signup">
            Sign up
          </Link>
        </div>
      )}
    </nav>
  );
}


export default Navbar;
