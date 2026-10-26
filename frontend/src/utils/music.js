// Small helpers that make the UI tolerant of slightly different
// response shapes from the backend (arrays, Spring pages, wrapped objects).

export const toList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const keys = [
    "content", "data", "items", "results",
    "songs", "playlists", "members", "recommendations", "likes",
  ];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

export const sameId = (a, b) =>
  a !== undefined && a !== null && b !== undefined && b !== null &&
  String(a) === String(b);

// A "like" can come back as a song or as { songId } / { song: {...} }.
export const getSongId = (item) => item?.songId ?? item?.song?.id ?? item?.id;

export const unwrapSong = (item) =>
  item?.song && typeof item.song === "object" ? item.song : item;

export const getCover = (song) =>
  song?.coverUrl || song?.coverImage || song?.imageUrl || song?.image || song?.thumbnail || "";

export const getAudio = (song) =>
  song?.audioUrl || song?.previewUrl || song?.streamUrl || song?.fileUrl || song?.songUrl || "";

const ART_CLASSES = ["song-art-one", "song-art-two", "song-art-three", "song-art-four"];

export const getArtClass = (song) => {
  const text = String(song?.id ?? song?.title ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return ART_CLASSES[hash % ART_CLASSES.length];
};

export const formatDuration = (value) => {
  const total = Number(value);
  if (!Number.isFinite(total) || total <= 0) return "";
  const seconds = total > 1000 ? Math.round(total / 1000) : Math.round(total);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

// Playlists
export const getPlaylistSongCount = (playlist) => {
  if (typeof playlist?.songCount === "number") return playlist.songCount;
  if (Array.isArray(playlist?.songs)) return playlist.songs.length;
  return 0;
};

export const getOwnerId = (playlist) =>
  playlist?.ownerId ?? playlist?.owner?.id ?? playlist?.userId ?? playlist?.createdBy?.id ?? playlist?.createdBy;

export const getMemberId = (member) => member?.userId ?? member?.user?.id ?? member?.id;

export const getMemberName = (member) =>
  member?.name || member?.username || member?.user?.name || member?.user?.username || member?.email || "User";

export const getUser = (response) => response?.data?.user ?? response?.data;
