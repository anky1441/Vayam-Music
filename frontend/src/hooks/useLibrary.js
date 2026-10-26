import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../api/api";
import {
  addSongToPlaylist,
  createPlaylist as createPlaylistRequest,
  getLikedSongs,
  getMyPlaylists,
  likeSong,
  unlikeSong,
} from "../api/musicApi";
import { getSongId, sameId, toList } from "../utils/music";

// Keeps the user's liked songs and playlists in sync with the backend.
export default function useLibrary() {
  const [likedItems, setLikedItems] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const clearNotice = useCallback(() => setNotice(""), []);

  const likedIds = useMemo(
    () => likedItems.map((item) => String(getSongId(item))),
    [likedItems]
  );

  const isLiked = useCallback(
    (songId) => likedIds.includes(String(songId)),
    [likedIds]
  );

  const refreshLikes = useCallback(async () => {
    try {
      const response = await getLikedSongs();
      setLikedItems(toList(response.data));
    } catch (error) {
      setNotice(getApiErrorMessage(error, "Could not load your liked songs."));
    }
  }, []);

  const refreshPlaylists = useCallback(async () => {
    try {
      const response = await getMyPlaylists();
      setPlaylists(toList(response.data));
    } catch (error) {
      setNotice(getApiErrorMessage(error, "Could not load your playlists."));
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([refreshLikes(), refreshPlaylists()]).finally(() => {
      if (active) setLibraryLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshLikes, refreshPlaylists]);

  // Optimistic like / unlike: update the UI first, undo if the server says no.
  const toggleLike = useCallback(
    async (song) => {
      if (!song?.id && song?.id !== 0) return;
      const wasLiked = isLiked(song.id);

      setLikedItems((current) =>
        wasLiked
          ? current.filter((item) => !sameId(getSongId(item), song.id))
          : [...current, song]
      );

      try {
        if (wasLiked) await unlikeSong(song.id);
        else await likeSong(song.id);
      } catch (error) {
        setLikedItems((current) =>
          wasLiked
            ? [...current, song]
            : current.filter((item) => !sameId(getSongId(item), song.id))
        );
        setNotice(getApiErrorMessage(error, "Could not update your like. Try again."));
      }
    },
    [isLiked]
  );

  // Creates the playlist, then adds the chosen songs one by one.
  const createPlaylist = useCallback(
    async ({ name, description, songIds = [] }) => {
      const response = await createPlaylistRequest({ name, description });
      const created = response.data?.playlist ?? response.data;

      for (const songId of songIds) {
        await addSongToPlaylist(created.id, songId);
      }

      await refreshPlaylists();
      return created;
    },
    [refreshPlaylists]
  );

  return {
    likedItems,
    isLiked,
    toggleLike,
    playlists,
    refreshPlaylists,
    createPlaylist,
    libraryLoading,
    notice,
    clearNotice,
  };
}
