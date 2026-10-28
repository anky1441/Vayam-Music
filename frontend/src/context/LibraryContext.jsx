import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isAuthenticated } from "../api/api";
import {
  getLikedSongs,
  likeSong as likeSongApi,
  unlikeSong as unlikeSongApi,
  getUserPlaylists,
  createPlaylist as createPlaylistApi,
  addSongToPlaylist as addSongToPlaylistApi,
} from "../api/musicApi";
import { sameId, unwrapSong } from "../utils/music";

const LibraryContext = createContext();

function readLocalStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function LibraryProvider({ children }) {
  const [likedSongs, setLikedSongs] = useState(() =>
    readLocalStorage("vayam-liked-songs", [])
  );
  const [playlists, setPlaylists] = useState(() =>
    readLocalStorage("vayam-playlists", [])
  );
  const [loading, setLoading] = useState(false);

  // Sync with backend if user is logged in
  const syncLibrary = useCallback(async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [likesRes, playlistsRes] = await Promise.allSettled([
        getLikedSongs(),
        getUserPlaylists(),
      ]);

      if (likesRes.status === "fulfilled" && Array.isArray(likesRes.value?.data)) {
        const serverLikes = likesRes.value.data.map((item) => unwrapSong(item));
        setLikedSongs((local) => {
          const merged = [...serverLikes];
          local.forEach((locItem) => {
            const locId = locItem?.id || locItem;
            const exists = merged.some((m) => sameId(m?.id || m, locId));
            if (!exists) merged.push(locItem);
          });
          localStorage.setItem("vayam-liked-songs", JSON.stringify(merged));
          return merged;
        });
      }

      if (playlistsRes.status === "fulfilled" && Array.isArray(playlistsRes.value?.data)) {
        const serverPlaylists = playlistsRes.value.data;
        setPlaylists((local) => {
          const merged = [...serverPlaylists];
          local.forEach((locP) => {
            const exists = merged.some((m) => sameId(m.id, locP.id));
            if (!exists) merged.push(locP);
          });
          localStorage.setItem("vayam-playlists", JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.warn("Library sync error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncLibrary();
  }, [syncLibrary]);

  // Keep localStorage in sync when likedSongs or playlists change
  useEffect(() => {
    localStorage.setItem("vayam-liked-songs", JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem("vayam-playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Check if a song is liked (by id or by title + artist)
  const isLiked = useCallback(
    (songOrId) => {
      if (!songOrId) return false;
      const targetId = typeof songOrId === "object" ? (songOrId.id || songOrId._id) : songOrId;
      const targetTitle = typeof songOrId === "object" ? songOrId.title : null;
      const targetArtist = typeof songOrId === "object" ? songOrId.artist : null;

      return likedSongs.some((item) => {
        if (!item) return false;
        const itemId = typeof item === "object" ? (item.id || item._id) : item;
        if (targetId && sameId(itemId, targetId)) return true;

        if (targetTitle && typeof item === "object" && item.title) {
          const titleMatch = item.title.trim().toLowerCase() === targetTitle.trim().toLowerCase();
          const artistMatch =
            !targetArtist ||
            !item.artist ||
            item.artist.trim().toLowerCase() === targetArtist.trim().toLowerCase();
          if (titleMatch && artistMatch) return true;
        }

        return false;
      });
    },
    [likedSongs]
  );

  // Toggle like
  const toggleLike = useCallback(
    async (song) => {
      if (!song) return;
      const songObj = unwrapSong(song);
      const songId = songObj.id || songObj._id;
      const alreadyLiked = isLiked(songObj);

      let nextLiked;
      if (alreadyLiked) {
        nextLiked = likedSongs.filter((item) => {
          if (!item) return false;
          const itemId = typeof item === "object" ? (item.id || item._id) : item;
          if (songId && sameId(itemId, songId)) return false;

          if (songObj.title && typeof item === "object" && item.title) {
            const titleMatch = item.title.trim().toLowerCase() === songObj.title.trim().toLowerCase();
            const artistMatch =
              !songObj.artist ||
              !item.artist ||
              item.artist.trim().toLowerCase() === songObj.artist.trim().toLowerCase();
            if (titleMatch && artistMatch) return false;
          }
          return true;
        });
      } else {
        const itemToSave = {
          id: songObj.id || `song-${Date.now()}`,
          title: songObj.title,
          artist: songObj.artist || "Unknown artist",
          coverUrl: songObj.coverUrl || songObj.coverImage || "",
          audioUrl: songObj.audioUrl || "",
          genre: songObj.genre || "",
          mood: songObj.mood || "",
          duration: songObj.duration || 0,
        };
        nextLiked = [...likedSongs, itemToSave];
      }

      setLikedSongs(nextLiked);
      localStorage.setItem("vayam-liked-songs", JSON.stringify(nextLiked));

      // Backend sync if authenticated and song has numeric ID
      const isNumericId =
        songId !== undefined &&
        songId !== null &&
        (typeof songId === "number" || (!isNaN(songId) && !String(songId).includes("-")));

      if (isAuthenticated() && isNumericId) {
        try {
          if (alreadyLiked) {
            await unlikeSongApi(songId);
          } else {
            await likeSongApi(songId);
          }
        } catch (apiErr) {
          console.warn("Backend like toggle failed, saved locally:", apiErr);
        }
      }
    },
    [likedSongs, isLiked]
  );

  // Add song to playlist
  const addSongToPlaylist = useCallback(
    async (playlistId, song) => {
      if (!playlistId || !song) return { success: false, error: "Missing required info" };
      const songObj = unwrapSong(song);
      const songId = songObj.id || songObj._id;

      let alreadyExists = false;

      const targetPlaylist = playlists.find((p) => sameId(p.id, playlistId));
      if (!targetPlaylist) {
        return { success: false, error: "Playlist not found" };
      }
      const targetPlaylistName = targetPlaylist.name;

      const existingSongs = Array.isArray(targetPlaylist.songs) ? targetPlaylist.songs : [];
      alreadyExists = existingSongs.some((s) => {
        const sId = typeof s === "object" ? (s.id || s._id) : s;
        if (songId && sameId(sId, songId)) return true;
        if (songObj.title && typeof s === "object" && s.title) {
          return (
            s.title.trim().toLowerCase() === songObj.title.trim().toLowerCase() &&
            (!songObj.artist || !s.artist || s.artist.trim().toLowerCase() === songObj.artist.trim().toLowerCase())
          );
        }
        return false;
      });

      if (alreadyExists) {
        return { success: false, alreadyIn: true, playlistName: targetPlaylistName };
      }

      const songItem = {
        id: songObj.id || `song-${Date.now()}`,
        title: songObj.title,
        artist: songObj.artist || "Unknown artist",
        coverUrl: songObj.coverUrl || songObj.coverImage || "",
        audioUrl: songObj.audioUrl || "",
        genre: songObj.genre || "",
        mood: songObj.mood || "",
        duration: songObj.duration || 0,
      };

      const nextPlaylists = playlists.map((p) => {
        if (sameId(p.id, playlistId)) {
          const pSongs = Array.isArray(p.songs) ? p.songs : [];
          return { ...p, songs: [...pSongs, songItem] };
        }
        return p;
      });

      setPlaylists(nextPlaylists);
      localStorage.setItem("vayam-playlists", JSON.stringify(nextPlaylists));

      // Backend sync
      const isNumericPlaylistId =
        typeof playlistId === "number" || (!isNaN(playlistId) && !String(playlistId).includes("-"));
      const isNumericSongId =
        songId !== undefined &&
        songId !== null &&
        (typeof songId === "number" || (!isNaN(songId) && !String(songId).includes("-")));

      if (isAuthenticated() && isNumericPlaylistId && isNumericSongId) {
        try {
          await addSongToPlaylistApi(playlistId, songId);
        } catch (apiErr) {
          console.warn("Backend add song to playlist failed, saved locally:", apiErr);
        }
      }

      return { success: true, playlistName: targetPlaylistName };
    },
    [playlists]
  );

  // Create playlist
  const createPlaylist = useCallback(
    async ({ name, description = "", initialSong = null, songIds = [], songs = [] }) => {
      if (!name || !name.trim()) return null;

      const trimmedName = name.trim();
      const trimmedDesc = description.trim();
      let initialSongs = [];

      if (initialSong) {
        initialSongs.push({
          id: initialSong.id || `song-${Date.now()}`,
          title: initialSong.title,
          artist: initialSong.artist || "Unknown artist",
          coverUrl: initialSong.coverUrl || initialSong.coverImage || "",
          audioUrl: initialSong.audioUrl || "",
          genre: initialSong.genre || "",
          mood: initialSong.mood || "",
          duration: initialSong.duration || 0,
        });
      }

      if (Array.isArray(songs) && songs.length > 0) {
        songs.forEach((s) => {
          const u = unwrapSong(s);
          if (!initialSongs.some((item) => sameId(item.id, u.id))) {
            initialSongs.push(u);
          }
        });
      }

      if (Array.isArray(songIds) && songIds.length > 0) {
        songIds.forEach((id) => {
          if (!initialSongs.some((item) => sameId(item.id, id))) {
            initialSongs.push({ id });
          }
        });
      }

      let newPlaylist = {
        id: `playlist-${Date.now()}`,
        name: trimmedName,
        description: trimmedDesc,
        songs: initialSongs,
      };

      if (isAuthenticated()) {
        try {
          const res = await createPlaylistApi({
            name: trimmedName,
            description: trimmedDesc,
          });
          const serverPlaylist = res.data?.playlist ?? res.data;
          if (serverPlaylist && serverPlaylist.id) {
            newPlaylist = {
              ...serverPlaylist,
              songs: initialSongs,
            };

            for (const s of initialSongs) {
              const sid = s.id;
              const isNumeric =
                sid !== undefined &&
                sid !== null &&
                (typeof sid === "number" || (!isNaN(sid) && !String(sid).includes("-")));
              if (isNumeric) {
                try {
                  await addSongToPlaylistApi(serverPlaylist.id, sid);
                } catch (addErr) {
                  console.warn("Backend add song error:", addErr);
                }
              }
            }
          }
        } catch (err) {
          console.warn("Backend playlist creation failed, created locally:", err);
        }
      }

      const nextPlaylists = [...playlists, newPlaylist];
      setPlaylists(nextPlaylists);
      localStorage.setItem("vayam-playlists", JSON.stringify(nextPlaylists));

      return newPlaylist;
    },
    [playlists]
  );

  return (
    <LibraryContext.Provider
      value={{
        likedSongs,
        setLikedSongs,
        playlists,
        setPlaylists,
        isLiked,
        toggleLike,
        addSongToPlaylist,
        createPlaylist,
        syncLibrary,
        loading,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext);
