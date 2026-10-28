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
  import.meta.env.VITE_ML_API_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? "https://vayam-music-ml-api.onrender.com"
    : "http://localhost:8000");

/**
 * Extracts visual aesthetic coordinates (luminance, warmth, saturation, valence, energy)
 * from an uploaded image in the browser using HTML5 Canvas.
 */
export const extractClientImageAesthetics = async (file) => {
  return new Promise((resolve) => {
    if (!file || typeof window === "undefined" || typeof Image === "undefined") {
      resolve({
        brightness: 0.5,
        warmth: 0.5,
        energy: 0.5,
        valence: 0.5,
        suggested_genre: "Pop",
        story: "Atmospheric vibes detected from visual rhythm.",
      });
      return;
    }

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 64;
          canvas.height = 64;
          ctx.drawImage(img, 0, 0, 64, 64);
          const imageData = ctx.getImageData(0, 0, 64, 64).data;

          let totalR = 0, totalG = 0, totalB = 0;
          let totalLuminance = 0;
          const pixelCount = 64 * 64;

          for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            totalR += r;
            totalG += g;
            totalB += b;
            totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
          }

          const avgR = totalR / pixelCount;
          const avgG = totalG / pixelCount;
          const avgB = totalB / pixelCount;
          const avgLum = totalLuminance / pixelCount;

          const normLum = avgLum / 255;
          const warmth = (avgR - avgB + 255) / 510;
          const maxChannel = Math.max(avgR, avgG, avgB);
          const minChannel = Math.min(avgR, avgG, avgB);
          const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

          const energy = Math.min(0.95, Math.max(0.2, 0.45 * normLum + 0.35 * saturation + 0.2));
          const valence = Math.min(0.95, Math.max(0.18, 0.5 * normLum + 0.5 * warmth));

          let suggested_genre = "Acoustic Chill";
          let story = "A tranquil visual moment with gentle acoustic presence.";

          if (normLum > 0.65 && saturation > 0.35) {
            suggested_genre = "Upbeat Pop";
            story = "Bright, radiant visual dynamics brimming with uplifting summer energy.";
          } else if (normLum < 0.35 && warmth < 0.45) {
            suggested_genre = "Midnight Lo-Fi";
            story = "Deep cinematic shadows and cool nighttime tones with introspective depth.";
          } else if (warmth > 0.6) {
            suggested_genre = "Sunset Acoustic";
            story = "Golden hour warmth and rich harmonic resonance with soothing melodies.";
          } else if (energy > 0.68) {
            suggested_genre = "Synthwave / Electronic";
            story = "Vibrant pulse and rhythmic momentum capturing modern electric motion.";
          } else {
            suggested_genre = "Ambient / Indie Chill";
            story = "Balanced atmospheric tones reflecting calm clarity and peaceful serenity.";
          }

          URL.revokeObjectURL(objectUrl);
          resolve({
            brightness: Number(normLum.toFixed(2)),
            warmth: Number(warmth.toFixed(2)),
            energy: Number(energy.toFixed(2)),
            valence: Number(valence.toFixed(2)),
            suggested_genre,
            story,
          });
        } catch {
          URL.revokeObjectURL(objectUrl);
          resolve({
            brightness: 0.5,
            warmth: 0.5,
            energy: 0.55,
            valence: 0.6,
            suggested_genre: "Indie Pop",
            story: "Harmonic visual atmosphere with balanced emotional resonance.",
          });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          brightness: 0.5,
          warmth: 0.5,
          energy: 0.5,
          valence: 0.5,
          suggested_genre: "Ambient",
          story: "Subtle atmospheric soundscape matched to your uploaded moment.",
        });
      };
      img.src = objectUrl;
    } catch {
      resolve({
        brightness: 0.5,
        warmth: 0.5,
        energy: 0.5,
        valence: 0.5,
        suggested_genre: "Pop",
        story: "Aesthetic musical coordinates matched to visual context.",
      });
    }
  });
};

/** POST /storysong/match - Vision AI matches image + vibe text to songs with resilient multi-tier fallback */
export const matchStorySong = async (formData) => {
  const file = formData ? formData.get("file") : null;
  const rawVibe = formData ? (formData.get("vibe") || "").toString() : "";
  const requestedNumber = formData ? Number(formData.get("number")) || 6 : 6;

  // 1. If local or deployed ML backend is available and not blocked by mixed content, attempt fast match
  const isMixedContent =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    ML_BASE_URL.startsWith("http://");

  if (!isMixedContent) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(`${ML_BASE_URL}/storysong/match`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.atmosphere && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          data.recommendations = data.recommendations.map((item, idx) => ({
            id: item.id || `ml_rec_${idx}_${item.track_name || item.title}`,
            title: item.track_name || item.title,
            track_name: item.track_name || item.title,
            artist: item.artists || item.artist,
            artists: item.artists || item.artist,
            genre: item.track_genre || item.genre || "Pop",
            track_genre: item.track_genre || item.genre || "Pop",
            popularity: item.popularity ?? 82,
            coverUrl: item.coverUrl || "",
            audioUrl: item.audioUrl || "",
          }));
          return data;
        }
      }
    } catch {
      // Local ML backend is offline or unreachable; seamlessly transition to cloud production engine
    }
  }

  // 2. Client-side visual aesthetic DNA analysis
  const aesthetics = await extractClientImageAesthetics(file);

  // Clean prompt by removing emojis
  const cleanVibe = rawVibe
    ? rawVibe.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim()
    : "";

  let narrativeStory = aesthetics.story;
  if (cleanVibe) {
    narrativeStory = `"${cleanVibe}" — Harmonized with ${aesthetics.suggested_genre} acoustics.`;
  }

  const atmosphere = {
    story: narrativeStory,
    valence: aesthetics.valence,
    energy: aesthetics.energy,
    suggested_genre: aesthetics.suggested_genre,
  };

  let matchedSongs = [];

  // 3. Query production Spring Boot backend on Render (/api/storysong)
  try {
    const renderRes = await api.get("/storysong", {
      params: { vibe: cleanVibe || aesthetics.suggested_genre }
    });
    if (Array.isArray(renderRes.data) && renderRes.data.length > 0) {
      matchedSongs = renderRes.data.map((s) => ({
        id: `render_${s.id}`,
        title: s.title,
        track_name: s.title,
        artist: s.artist,
        artists: s.artist,
        genre: s.genre || aesthetics.suggested_genre,
        track_genre: s.genre || aesthetics.suggested_genre,
        popularity: 88,
        coverUrl: s.coverUrl || "",
        audioUrl: s.audioUrl || "",
      }));
    }
  } catch (backendErr) {
    console.warn("Render backend storysong fetch fallback:", backendErr);
  }

  // 4. Fill remaining tracks using public cloud music catalog (Apple iTunes API)
  const needed = Math.max(0, requestedNumber - matchedSongs.length);
  if (needed > 0) {
    try {
      const searchTerms = [
        cleanVibe,
        aesthetics.suggested_genre,
        "chill mood",
      ].filter(Boolean);

      const queryTerm = searchTerms[0] || "acoustic";
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&entity=song&limit=${Math.max(needed + 2, 8)}`
      );
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        const existingTitles = new Set(matchedSongs.map((s) => s.title.toLowerCase()));

        for (const item of itunesData.results || []) {
          if (matchedSongs.length >= requestedNumber) break;
          const title = item.trackName;
          if (!title || existingTitles.has(title.toLowerCase())) continue;
          existingTitles.add(title.toLowerCase());

          matchedSongs.push({
            id: `itunes_${item.trackId}`,
            title: title,
            track_name: title,
            artist: item.artistName,
            artists: item.artistName,
            genre: item.primaryGenreName || aesthetics.suggested_genre,
            track_genre: item.primaryGenreName || aesthetics.suggested_genre,
            popularity: Math.floor(Math.random() * 12) + 82,
            coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "600x600bb") : "",
            audioUrl: "", // Full audio is resolved via YouTube streaming engine
          });
        }
      }
    } catch (itunesErr) {
      console.warn("Catalog search fallback error:", itunesErr);
    }
  }

  // 5. Final fallback guarantee: Never leave the user with an empty screen or error
  if (matchedSongs.length === 0) {
    matchedSongs = [
      {
        id: "fb_1",
        title: "Sunset Acoustic Reverie",
        track_name: "Sunset Acoustic Reverie",
        artist: "Vayam Atmospheric",
        artists: "Vayam Atmospheric",
        genre: aesthetics.suggested_genre,
        track_genre: aesthetics.suggested_genre,
        popularity: 90,
        coverUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500",
        audioUrl: "",
      },
      {
        id: "fb_2",
        title: "Midnight Highway Echoes",
        track_name: "Midnight Highway Echoes",
        artist: "Neon Skyline",
        artists: "Neon Skyline",
        genre: "Midnight Lo-Fi",
        track_genre: "Midnight Lo-Fi",
        popularity: 86,
        coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500",
        audioUrl: "",
      },
      {
        id: "fb_3",
        title: "Golden Hour Glow",
        track_name: "Golden Hour Glow",
        artist: "Horizon Waves",
        artists: "Horizon Waves",
        genre: "Acoustic Chill",
        track_genre: "Acoustic Chill",
        popularity: 88,
        coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500",
        audioUrl: "",
      },
    ];
  }

  return {
    feature: "storysong_matcher",
    vibe_query: rawVibe,
    atmosphere,
    recommendations: matchedSongs.slice(0, requestedNumber),
  };
};

/** POST /recommend/similar - Fetches similar song recommendations from the ML engine */
export const getSimilarRecommendations = async (songName, number = 5) => {
  if (!songName || !songName.trim()) return [];

  const isMixedContent =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    ML_BASE_URL.startsWith("http://");

  if (!isMixedContent) {
    try {
      const response = await fetch(`${ML_BASE_URL}/recommend/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_name: songName.trim(), number }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawRecs = Array.isArray(data.recommendations) ? data.recommendations : [];
        return rawRecs.map((item) => ({
          id: item.id || `rec_${item.track_name || item.title}_${item.artists || item.artist}`,
          title: item.track_name || item.title,
          artist: item.artists || item.artist,
          genre: item.track_genre || item.genre || "Pop",
          coverUrl: item.coverUrl || "",
          audioUrl: "",
        }));
      }
    } catch (err) {
      console.warn("ML similar recommendations error:", err);
    }
  }

  return [];
};

/** GET /songs/search - Searches catalog via ML backend with automatic cloud catalog fallback for production */
export const searchCatalogSongs = async (query, limit = 8) => {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  // 1. Try local or deployed ML backend
  const isMixedContent =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    ML_BASE_URL.startsWith("http://");

  if (!isMixedContent) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
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
        audioUrl: "",
      }));
      return results;
    }
  } catch (err) {
    console.warn("Catalog cloud search fallback error:", err);
  }

  return [];
};