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

function Navbar({ onProfileClick, onHomeClick, onSearch, searchQuery = "" }) {
  const [search, setSearch] = useState(searchQuery);
  const [initial, setInitial] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const { playSong } = usePlayer();

  // Sync internal search state if parent passes new searchQuery
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== search) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  // Show the first letter of the user's name on the profile button.
  useEffect(() => {
    if (!loggedIn) return;
    let active = true;

    getCurrentUser()
      .then((response) => {
        const name = response.data?.name ?? response.data?.user?.name;
        if (active && name) setInitial(name.trim().charAt(0).toUpperCase());
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [loggedIn]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle typing: immediate in-page filter + debounced floating dropdown fetch
  const handleInputChange = (event) => {
    const query = event.target.value;
    setSearch(query);

    // 1. Immediate in-page filter for parent view (e.g. Home)
    if (onSearch) {
      onSearch(query);
    }

    // 2. Clear previous debounced lookup
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await searchSongs(query.trim());
        const data = Array.isArray(response.data) ? response.data : [];
        setSearchResults(data);
      } catch (error) {
        console.warn("Floating search query fallback:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 220);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchResults([]);
    setShowDropdown(false);
    setIsSearching(false);
    if (onSearch) {
      onSearch("");
    }
  };

  const handleSelectSong = (song) => {
    setShowDropdown(false);
    playSong(song);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setShowDropdown(false);
    const query = search.trim();
    if (onSearch) {
      onSearch(query);
    } else if (query) {
      navigate(`/home?search=${encodeURIComponent(query)}`);
    }
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

      {/* Search Bar Wrapper with Floating Dropdown */}
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

          <input
            type="search"
            placeholder="Search songs, artists, moods..."
            value={search}
            onChange={handleInputChange}
            onFocus={() => {
              if (search.trim() && (searchResults.length > 0 || isSearching)) {
                setShowDropdown(true);
              }
            }}
            aria-label="Search music"
          />

          {search && (
            <button
              type="button"
              className="navbar-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </form>

        {/* Floating Live Results Dropdown */}
        {showDropdown && search.trim() && (
          <div className="navbar-search-dropdown">
            {isSearching ? (
              <div className="search-dropdown-message">Searching tracks...</div>
            ) : searchResults.length === 0 ? (
              <div className="search-dropdown-message">
                No songs found for "{search}".
              </div>
            ) : (
              <>
                <div className="search-dropdown-header">
                  Top Matches ({searchResults.length})
                </div>
                <div className="search-dropdown-list">
                  {searchResults.slice(0, 6).map((song) => (
                    <div
                      key={song.id || song._id || song.title}
                      className="search-result-item"
                      onClick={() => handleSelectSong(song)}
                    >
                      <div className="search-result-thumb">
                        {song.coverUrl || song.coverImage ? (
                          <img
                            src={song.coverUrl || song.coverImage}
                            alt={song.title}
                          />
                        ) : (
                          <span>♫</span>
                        )}
                      </div>

                      <div className="search-result-info">
                        <span className="search-result-title">
                          {song.title}
                        </span>
                        <span className="search-result-artist">
                          {song.artist || "Unknown artist"}
                          {song.genre ? ` · ${song.genre}` : ""}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="search-result-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSong(song);
                        }}
                        aria-label={`Play ${song.title}`}
                        title="Play"
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
