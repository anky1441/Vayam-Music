
import api from "./api";

// Authentication
export const registerUser = (data) =>
  api.post("/auth/register", data);

export const loginUser = (data) =>
  api.post("/auth/login", data);

// User profile
export const getCurrentUser = () =>
  api.get("/users/me");

export const updateProfile = (data) =>
  api.patch("/users/me", data);

// Songs
export const getSongs = () =>
  api.get("/songs");

export const getSongById = (id) =>
  api.get(`/songs/${id}`);

export const searchSongs = (query) =>
  api.get("/songs/search", { params: { query } });

export const getSongsByMood = (mood) =>
  api.get(`/songs/mood/${encodeURIComponent(mood)}`);

// Likes
export const getLikedSongs = () =>
  api.get("/users/me/likes");

export const likeSong = (songId) =>
  api.post(`/songs/${songId}/like`);

export const unlikeSong = (songId) =>
  api.delete(`/songs/${songId}/like`);

export const checkSongLike = (songId) =>
  api.get(`/songs/${songId}/like`);

// Recommendations
export const getRecommendations = () =>
  api.get("/recommendations");

export const getMoodRecommendations = (mood) =>
  api.get(`/recommendations/mood/${encodeURIComponent(mood)}`);

export const getSongRecommendations = (songId) =>
  api.get(`/recommendations/song/${songId}`);

// Playlists
export const getPlaylists = () =>
  api.get("/playlists");

export const getPlaylistById = (id) =>
  api.get(`/playlists/${id}`);

export const createPlaylist = (data) =>
  api.post("/playlists", data);

export const updatePlaylist = (id, data) =>
  api.put(`/playlists/${id}`, data);

export const deletePlaylist = (id) =>
  api.delete(`/playlists/${id}`);

// Playlist songs
export const getPlaylistSongs = (id) =>
  api.get(`/playlists/${id}/songs`);

export const addSongToPlaylist = (id, songId) =>
  api.post(`/playlists/${id}/songs/${songId}`);

export const removeSongFromPlaylist = (id, songId) =>
  api.delete(`/playlists/${id}/songs/${songId}`);

// Generate playlist
export const generatePlaylist = (data) =>
  api.post("/playlists/generate", data);

// Playlist members
export const getPlaylistMembers = (id) =>
  api.get(`/playlists/${id}/members`);

export const addPlaylistMember = (id, data) =>
  api.post(`/playlists/${id}/members`, data);

export const removePlaylistMember = (id, userId) =>
  api.delete(`/playlists/${id}/members/${userId}`);
