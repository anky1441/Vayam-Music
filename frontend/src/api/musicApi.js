import api from "./api";

/* ==========================================================================
   AUTHENTICATION ENDPOINTS (DATABASE)
   ========================================================================== */

/** POST /api/auth/register - Registers new user in database */
export const registerUser = (data) => api.post("/auth/register", data);

/** POST /api/auth/login - Logs in user */
export const loginUser = (data) => api.post("/auth/login", data);

/** POST /api/auth/google - Authenticates with Google credential/token */
export const googleLogin = (data) => api.post("/auth/google", data);
export const googleAuth = googleLogin;


/* ==========================================================================
   USER PROFILE ENDPOINTS (DATABASE)
   ========================================================================== */

/** GET /api/users/me - Retrieves current user profile from database */
export const getCurrentUser = () => api.get("/users/me");

/** PUT /api/users/me - Updates profile directly in database */
export const updateProfile = (data) => api.put("/users/me", data);

/** GET /api/users/me/likes - Retrieves user's liked songs from database */
export const getLikedSongs = () => api.get("/users/me/likes");

/** GET /api/users/me/playlists - Retrieves user's playlists from database */
export const getUserPlaylists = () => api.get("/users/me/playlists");
export const getMyPlaylists = getUserPlaylists;


/* ==========================================================================
   SONG ENDPOINTS (DATABASE)
   ========================================================================== */

/** GET /api/songs - Retrieves all songs from database */
export const getSongs = () => api.get("/songs");

/** GET /api/songs/{id} - Retrieves single song by ID from database */
export const getSongById = (id) => api.get(`/songs/${id}`);

/** GET /api/songs/search?query={query} - Searches songs in database */
export const searchSongs = (query) =>
  api.get("/songs/search", { params: { query } });

/** GET /api/songs/mood/{mood} - Retrieves songs by mood from database */
export const getSongsByMood = (mood) =>
  api.get(`/songs/mood/${encodeURIComponent(mood)}`);


/* ==========================================================================
   SONG LIKE ENDPOINTS (DATABASE)
   ========================================================================== */

/** POST /api/songs/{songId}/like - Saves like to database */
export const likeSong = (songId) => api.post(`/songs/${songId}/like`);

/** DELETE /api/songs/{songId}/like - Removes like from database */
export const unlikeSong = (songId) => api.delete(`/songs/${songId}/like`);

/** GET /api/songs/{songId}/like - Checks like status in database */
export const checkSongLike = (songId) => api.get(`/songs/${songId}/like`);


/* ==========================================================================
   RECOMMENDATIONS ENDPOINTS (DATABASE / ML)
   ========================================================================== */

/** GET /api/recommendations - Personalized recommendations */
export const getRecommendations = () => api.get("/recommendations");

/** GET /api/recommendations/mood/{mood} - Mood recommendations */
export const getMoodRecommendations = (mood) =>
  api.get(`/recommendations/mood/${encodeURIComponent(mood)}`);

/** GET /api/recommendations/song/{songId} - Song-specific recommendations */
export const getSongRecommendations = (songId) =>
  api.get(`/recommendations/song/${songId}`);


/* ==========================================================================
   PLAYLIST ENDPOINTS (DATABASE)
   ========================================================================== */

/** POST /api/playlists - Creates playlist in database */
export const createPlaylist = (data) => api.post("/playlists", data);

/** GET /api/playlists - Retrieves playlists from database */
export const getPlaylists = () => api.get("/playlists");

/** GET /api/playlists/{id} - Retrieves playlist details from database */
export const getPlaylistById = (id) => api.get(`/playlists/${id}`);

/** PUT /api/playlists/{id} - Updates playlist in database */
export const updatePlaylist = (id, data) => api.put(`/playlists/${id}`, data);

/** DELETE /api/playlists/{id} - Deletes playlist from database */
export const deletePlaylist = (id) => api.delete(`/playlists/${id}`);


/* ==========================================================================
   PLAYLIST SONGS ENDPOINTS (DATABASE)
   ========================================================================== */

/** GET /api/playlists/{id}/songs - Gets playlist songs from database */
export const getPlaylistSongs = (id) => api.get(`/playlists/${id}/songs`);

/** POST /api/playlists/{id}/songs/{songId} - Adds song to playlist in database */
export const addSongToPlaylist = (id, songId) =>
  api.post(`/playlists/${id}/songs/${songId}`);

/** DELETE /api/playlists/{id}/songs/{songId} - Removes song from playlist in database */
export const removeSongFromPlaylist = (id, songId) =>
  api.delete(`/playlists/${id}/songs/${songId}`);

/** POST /api/playlists/generate - Generates AI playlist stored in database */
export const generatePlaylist = (data) =>
  api.post("/playlists/generate", data);


/* ==========================================================================
   PLAYLIST MEMBERS (COLLABORATIVE DATABASE)
   ========================================================================== */

/** GET /api/playlists/{id}/members - Gets collaborators from database */
export const getPlaylistMembers = (id) => api.get(`/playlists/${id}/members`);

/** POST /api/playlists/{id}/members - Adds collaborator to database */
export const addPlaylistMember = (id, data) =>
  api.post(`/playlists/${id}/members`, data);

/** DELETE /api/playlists/{id}/members/{userId} - Removes collaborator from database */
export const removePlaylistMember = (id, userId) =>
  api.delete(`/playlists/${id}/members/${userId}`);

/* ==========================================================================
   AI STORYSONG & STREAMING (FASTAPI ML BACKEND)
   ========================================================================== */

export const ML_BASE_URL =
  import.meta.env.VITE_ML_API_URL || "http://localhost:8000";

/** POST /storysong/match - Feature 4: Vision AI matches image + vibe text to songs */
export const matchStorySong = async (formData) => {
  const response = await fetch(`${ML_BASE_URL}/storysong/match`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "StorySong matching failed");
  }
  return response.json();
};

/** GET /songs/search - Searches catalog via ML backend with automatic cloud catalog fallback for production */
export const searchCatalogSongs = async (query, limit = 8) => {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  // 1. Try local or deployed ML backend if not blocked by mixed-content
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const isLocalMl =
    ML_BASE_URL.startsWith("http://localhost") ||
    ML_BASE_URL.startsWith("http://127.0.0.1");

  if (!isHttps || !isLocalMl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(
        `${ML_BASE_URL}/songs/search?query=${encodeURIComponent(q)}&limit=${limit}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Continue to cloud fallback
    }
  }

  // 2. Cloud Fallback: Direct public music catalog via Apple iTunes Search API (100% HTTPS & CORS-friendly)
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      const results = (data.results || []).map((item) => ({
        id: `itunes_${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        genre: item.primaryGenreName || "Pop",
        popularity: 80,
        coverUrl: item.artworkUrl100
          ? item.artworkUrl100.replace("100x100bb", "600x600bb")
          : "",
        audioUrl: item.previewUrl || "",
      }));
      return results;
    }
  } catch (err) {
    console.warn("Catalog cloud search fallback error:", err);
  }

  return [];
};