
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../api/api";
import { getCurrentUser, searchSongs } from "../api/musicApi";
import { usePlayer } from "../context/PlayerContext";

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
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const { playSong } = usePlayer();

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search when user types
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearch(query);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      if (onSearch) onSearch("");
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchSongs(query.trim());
        const data = Array.isArray(res.data) ? res.data : [];
        setSearchResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setShowDropdown(false);
    const query = search.trim();
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/home?search=${encodeURIComponent(query)}`);
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchResults([]);
    setShowDropdown(false);
    if (onSearch) onSearch("");
  };

  const handleSelectSong = (song) => {
    setShowDropdown(false);
    playSong(song);
  };

  const goHome = (event) => {
    event.preventDefault();
    if (onHomeClick) onHomeClick();
    navigate("/home");
  };

  const openProfile = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
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

      {/* Search Bar with live floating results dropdown */}
      <div className="navbar-search-wrapper" ref={searchContainerRef}>
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
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


      <form
        className="navbar-search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch?.(search.trim());
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
            placeholder="Search songs, artists, moods..."
            value={search}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            aria-label="Search music"
          />

          {search && (
            <button
              type="button"
              className="navbar-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </form>

        {/* Live Instant Search Dropdown */}
        {showDropdown && (
          <div className="navbar-search-dropdown">
            {isSearching ? (
              <div className="search-dropdown-message">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="search-dropdown-message">
                No songs found for "{search}".
              </div>
            ) : (
              <>
                <div className="search-dropdown-header">
                  Matching Songs ({searchResults.length})
                </div>
                <div className="search-dropdown-list">
                  {searchResults.slice(0, 6).map((song) => (
                    <div
                      key={song.id}
                      className="search-result-item"
                      onClick={() => handleSelectSong(song)}
                    >
                      <div className="search-result-thumb">
                        {song.coverUrl ? (
                          <img src={song.coverUrl} alt={song.title} />
                        ) : (
                          <span>♫</span>
                        )}
                      </div>
                      <div className="search-result-info">
                        <span className="search-result-title">
                          {song.title}
                        </span>
                        <span className="search-result-artist">
                          {song.artist}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="search-result-play-btn"
                        aria-label="Play song"
                      >
                        ▶
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>


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
