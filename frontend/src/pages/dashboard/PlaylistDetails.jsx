import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage, isAuthenticated } from "../../api/api";
import {
  addPlaylistMember,
  addSongToPlaylist,
  deletePlaylist,
  getCurrentUser,
  getPlaylistById,
  getPlaylistMembers,
  getPlaylistSongs,
  removePlaylistMember,
  removeSongFromPlaylist,
  searchSongs,
  updatePlaylist,
} from "../../api/musicApi";
import SongRow from "../../components/SongRow";
import {
  getMemberId,
  getMemberName,
  getOwnerId,
  getUser,
  sameId,
  toList,
  unwrapSong,
} from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

// Helper to check if an ID is a backend database Long ID (numeric and not starting with 'playlist-')
const isDatabaseId = (id) =>
  (typeof id === "number" || (!isNaN(id) && !String(id).includes("-"))) &&
  String(id).trim() !== "";

// One playlist: songs, editing, deleting and (for shared playlists) members.
// Used inside the Home shell and on the /collab/:id page.
function PlaylistDetails({
  playlistId: passedId,
  playlist: initialPlaylist,
  availableSongs = [],
  onBack,
  backLabel = "← My Playlists",
  onChanged,
  onDeleted,
  onOpenSong,
  isLiked,
  onToggleLike,
}) {
  const playlistId = passedId || initialPlaylist?.id || initialPlaylist?._id;
  const [playlist, setPlaylist] = useState(initialPlaylist || null);

  const resolveSongs = useCallback(
    (p) => {
      const pSongs = Array.isArray(p?.songs) ? p.songs : [];
      return pSongs
        .map((item) => {
          if (item && typeof item === "object") return unwrapSong(item);
          return (
            availableSongs.find((s) => sameId(s.id, item)) || {
              id: item,
              title: `Song #${item}`,
              artist: "Unknown",
            }
          );
        })
        .filter(Boolean);
    },
    [availableSongs]
  );

  const [songs, setSongs] = useState(() => resolveSongs(initialPlaylist));
  const [members, setMembers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(!initialPlaylist);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState("");
  const [addResults, setAddResults] = useState([]);
  const [addLoading, setAddLoading] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!playlistId || !isDatabaseId(playlistId) || !isAuthenticated()) return;
    try {
      const response = await getPlaylistMembers(playlistId);
      setMembers(toList(response.data));
    } catch {
      setMembers([]);
    }
  }, [playlistId]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!playlistId) {
        if (initialPlaylist) {
          setPlaylist(initialPlaylist);
          setSongs(resolveSongs(initialPlaylist));
          setLoading(false);
        } else {
          setError("Playlist not found.");
          setLoading(false);
        }
        return;
      }

      // If this is a local client-side playlist (non-database ID)
      if (!isDatabaseId(playlistId)) {
        let found = initialPlaylist;
        if (!found) {
          try {
            const localPlaylists = JSON.parse(
              localStorage.getItem("vayam-playlists") || "[]"
            );
            found = localPlaylists.find((p) => sameId(p.id, playlistId));
          } catch {
            found = null;
          }
        }
        if (found) {
          setPlaylist(found);
          setSongs(resolveSongs(found));
        } else {
          setError("Playlist not found.");
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [playlistRes, songsRes, meRes] = await Promise.all([
          getPlaylistById(playlistId).catch(() => null),
          getPlaylistSongs(playlistId).catch(() => null),
          getCurrentUser().catch(() => null),
        ]);
        if (!active) return;

        if (playlistRes?.data) {
          setPlaylist(playlistRes.data?.playlist ?? playlistRes.data);
        } else if (initialPlaylist) {
          setPlaylist(initialPlaylist);
        }

        if (songsRes?.data) {
          setSongs(toList(songsRes.data).map(unwrapSong));
        } else if (initialPlaylist?.songs) {
          setSongs(resolveSongs(initialPlaylist));
        }

        setMe(meRes ? getUser(meRes) : null);
        await loadMembers();
      } catch (requestError) {
        if (active) {
          if (initialPlaylist) {
            setPlaylist(initialPlaylist);
            setSongs(resolveSongs(initialPlaylist));
          } else {
            setError(getApiErrorMessage(requestError, "Could not load this playlist."));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [playlistId, initialPlaylist, loadMembers, resolveSongs]);

  // Search catalogue and availableSongs while the "Add songs" panel is open.
  useEffect(() => {
    if (!showAdd) return undefined;
    const query = addText.trim().toLowerCase();
    let active = true;

    if (!query) {
      // Default: show first 25 candidate songs from availableSongs
      setAddResults(availableSongs.slice(0, 25));
      return undefined;
    }

    // Instant local filter on availableSongs
    const localMatches = availableSongs.filter((song) => {
      const title = (song?.title || "").toLowerCase();
      const artist = (song?.artist || "").toLowerCase();
      const genre = (song?.genre || "").toLowerCase();
      return (
        title.includes(query) ||
        artist.includes(query) ||
        genre.includes(query)
      );
    });
    setAddResults(localMatches);

    // If online search is available, query backend and merge
    const timer = setTimeout(async () => {
      setAddLoading(true);
      try {
        const response = await searchSongs(addText.trim());
        if (active) {
          const serverSongs = toList(response?.data).map(unwrapSong);
          const seen = new Set(localMatches.map((s) => String(s.id)));
          const merged = [...localMatches];
          for (const s of serverSongs) {
            if (!seen.has(String(s.id))) {
              seen.add(String(s.id));
              merged.push(s);
            }
          }
          setAddResults(merged);
        }
      } catch {
        // Keep local matches if backend query fails
      } finally {
        if (active) setAddLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [addText, showAdd, availableSongs]);

  const ownerId = getOwnerId(playlist);
  // If the backend does not send an owner, show the controls and let it enforce permissions.
  const isOwner = ownerId === undefined || ownerId === null || sameId(ownerId, me?.id);
  const isShared = members.length > 1;

  function startEditing() {
    setDraftName(playlist?.name || "");
    setDraftDescription(playlist?.description || "");
    setMessage("");
    setEditing(true);
  }

  async function saveEdits(event) {
    event.preventDefault();
    if (!draftName.trim()) return;

    setSaving(true);
    setMessage("");
    try {
      if (isDatabaseId(playlistId) && isAuthenticated()) {
        await updatePlaylist(playlistId, {
          name: draftName.trim(),
          description: draftDescription.trim(),
        });
      }
      const updatedPlaylist = {
        ...(playlist || {}),
        name: draftName.trim(),
        description: draftDescription.trim(),
      };
      setPlaylist(updatedPlaylist);

      try {
        const localPlaylists = JSON.parse(
          localStorage.getItem("vayam-playlists") || "[]"
        );
        const updated = localPlaylists.map((p) =>
          sameId(p.id, playlistId)
            ? { ...p, name: draftName.trim(), description: draftDescription.trim() }
            : p
        );
        localStorage.setItem("vayam-playlists", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }

      setEditing(false);
      onChanged?.();
    } catch (requestError) {
      setMessage(getApiErrorMessage(requestError, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${playlist?.name || "this playlist"}"? This cannot be undone.`)) return;

    try {
      if (isDatabaseId(playlistId) && isAuthenticated()) {
        await deletePlaylist(playlistId);
      }

      try {
        const localPlaylists = JSON.parse(
          localStorage.getItem("vayam-playlists") || "[]"
        );
        const updated = localPlaylists.filter((p) => !sameId(p.id, playlistId));
        localStorage.setItem("vayam-playlists", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }

      onChanged?.();
      onDeleted?.();
    } catch (requestError) {
      setMessage(getApiErrorMessage(requestError, "Could not delete this playlist."));
    }
  }

  async function handleAddSong(song) {
    setMessage("");
    try {
      if (isDatabaseId(playlistId) && isAuthenticated()) {
        await addSongToPlaylist(playlistId, song.id);
      }

      const unwrapped = unwrapSong(song);
      setSongs((current) => {
        if (current.some((item) => sameId(item.id, unwrapped.id))) return current;
        return [...current, unwrapped];
      });

      setPlaylist((current) => {
        if (!current) return current;
        const curSongs = Array.isArray(current.songs) ? current.songs : [];
        if (curSongs.some((item) => sameId(item?.id ?? item, unwrapped.id))) return current;
        return { ...current, songs: [...curSongs, unwrapped] };
      });

      try {
        const localPlaylists = JSON.parse(
          localStorage.getItem("vayam-playlists") || "[]"
        );
        const updated = localPlaylists.map((p) => {
          if (sameId(p.id, playlistId)) {
            const pSongs = Array.isArray(p.songs) ? p.songs : [];
            if (!pSongs.some((item) => sameId(item?.id ?? item, unwrapped.id))) {
              return { ...p, songs: [...pSongs, unwrapped] };
            }
          }
          return p;
        });
        localStorage.setItem("vayam-playlists", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }

      onChanged?.();
    } catch (requestError) {
      setMessage(getApiErrorMessage(requestError, "Could not add this song."));
    }
  }

  async function handleRemoveSong(song) {
    setMessage("");
    try {
      if (isDatabaseId(playlistId) && isAuthenticated()) {
        await removeSongFromPlaylist(playlistId, song.id);
      }

      const unwrapped = unwrapSong(song);
      setSongs((current) => current.filter((item) => !sameId(item.id, unwrapped.id)));

      setPlaylist((current) => {
        if (!current) return current;
        const curSongs = Array.isArray(current.songs) ? current.songs : [];
        return {
          ...current,
          songs: curSongs.filter((item) => !sameId(item?.id ?? item, unwrapped.id)),
        };
      });

      try {
        const localPlaylists = JSON.parse(
          localStorage.getItem("vayam-playlists") || "[]"
        );
        const updated = localPlaylists.map((p) => {
          if (sameId(p.id, playlistId)) {
            const pSongs = Array.isArray(p.songs) ? p.songs : [];
            return {
              ...p,
              songs: pSongs.filter((item) => !sameId(item?.id ?? item, unwrapped.id)),
            };
          }
          return p;
        });
        localStorage.setItem("vayam-playlists", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }

      onChanged?.();
    } catch (requestError) {
      setMessage(getApiErrorMessage(requestError, "Could not remove this song."));
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    const email = memberEmail.trim();
    if (!email) return;

    setMemberBusy(true);
    setMessage("");
    try {
      // ASSUMED request body - rename the field here if your DTO differs.
      await addPlaylistMember(playlistId, { email });
      setMemberEmail("");
      await loadMembers();
      onChanged?.();
    } catch (requestError) {
      setMessage(getApiErrorMessage(requestError, "Could not add this person. Check the email and try again."));
    } finally {
      setMemberBusy(false);
    }
  }

  async function handleRemoveMember(member) {
    const memberId = getMemberId(member);
    const isMe = sameId(memberId, me?.id);

    if (isMe && !window.confirm("Leave this playlist?")) return;

    setMessage("");
    try {
      await removePlaylistMember(playlistId, memberId);
      if (isMe) {
        onChanged?.();
        onDeleted?.();
        return;
      }
      setMembers((current) => current.filter((item) => !sameId(getMemberId(item), memberId)));
      onChanged?.();
    } catch (requestError) {
      setMessage(getApiErrorMessage(requestError, "Could not remove this member."));
    }
  }

  if (loading) {
    return (
      <section className="dashboard-view">
        <button type="button" className="dashboard-add-button" onClick={onBack}>{backLabel}</button>
        <p className="dashboard-subtitle" style={{ marginTop: 24 }}>Loading playlist...</p>
      </section>
    );
  }

  if (error || !playlist) {
    return (
      <section className="dashboard-view">
        <button type="button" className="dashboard-add-button" onClick={onBack}>{backLabel}</button>
        <p className="dv-error" role="alert" style={{ marginTop: 24 }}>
          {error || "Playlist not found."}
        </p>
      </section>
    );
  }

  return (
    <section className="dashboard-view">
      <button type="button" className="dashboard-add-button" onClick={onBack}>{backLabel}</button>

      <p className="dashboard-eyebrow" style={{ marginTop: 24 }}>
        {isShared ? "SHARED PLAYLIST" : "YOUR PLAYLIST"}
      </p>

      {editing ? (
        <form className="playlist-form" onSubmit={saveEdits}>
          <label htmlFor="pd-name">Playlist name</label>
          <input
            id="pd-name"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            maxLength={60}
            required
          />
          <label htmlFor="pd-description">Description</label>
          <textarea
            id="pd-description"
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            rows={3}
          />
          <div className="dv-actions">
            <button type="submit" className="dashboard-primary-button" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" className="dashboard-add-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1>{playlist.name}</h1>
          <p className="dashboard-subtitle">
            {playlist.description || "Your personal music collection"}
            {" · "}
            {songs.length} {songs.length === 1 ? "song" : "songs"}
            {members.length > 1 ? ` · ${members.length} members` : ""}
          </p>

          <div className="dv-actions">
            <button
              type="button"
              className="dashboard-primary-button"
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? "Close" : "＋ Add songs"}
            </button>
            {isOwner && (
              <>
                <button type="button" className="dashboard-add-button" onClick={startEditing}>
                  Edit
                </button>
                <button type="button" className="dashboard-add-button dv-danger" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}

      {message && <p className="dv-error" role="alert">{message}</p>}

      {showAdd && (
        <div className="dv-panel">
          <h2>Add songs</h2>
          <input
            className="dv-input"
            type="search"
            value={addText}
            onChange={(event) => setAddText(event.target.value)}
            placeholder="Search songs or artists..."
            aria-label="Search songs to add"
            autoFocus
          />

          {addLoading && <p className="dashboard-subtitle">Searching...</p>}

          {!addLoading && (
            <div className="dashboard-song-list">
              {addResults.length === 0 ? (
                <p className="dashboard-subtitle">
                  {addText.trim() ? "No songs found." : "No songs available to add."}
                </p>
              ) : (
                addResults.map((song) => {
                  const added = songs.some((item) => sameId(item.id, song.id));
                  return (
                    <SongRow key={song.id} song={song} onOpen={onOpenSong ? () => onOpenSong(song, addResults) : undefined}>
                      <button
                        type="button"
                        className={`dashboard-add-button ${added ? "selected" : ""}`}
                        onClick={() => !added && handleAddSong(song)}
                        disabled={added}
                      >
                        {added ? "Added ✓" : "+ Add"}
                      </button>
                    </SongRow>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      <div className="pd-layout">
        <div>
          {songs.length === 0 ? (
            <div className="dashboard-empty">
              <span className="dashboard-big-icon">♫</span>
              <h2>This playlist is empty</h2>
              <p>Use "Add songs" to fill it up.</p>
            </div>
          ) : (
            <div className="dashboard-song-list">
              {songs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  liked={isLiked?.(song)}
                  onToggleLike={() => onToggleLike?.(song)}
                  onOpen={onOpenSong ? () => onOpenSong(song, songs) : undefined}
                >
                  <button
                    type="button"
                    className="dashboard-add-button dv-danger"
                    onClick={() => handleRemoveSong(song)}
                    aria-label={`Remove ${song.title}`}
                  >
                    Remove
                  </button>
                </SongRow>
              ))}
            </div>
          )}
        </div>

        <aside className="dv-panel pd-members">
          <h2>Members ({members.length})</h2>

          {members.length === 0 ? (
            <p className="dashboard-subtitle">Only you for now.</p>
          ) : (
            <ul className="member-list">
              {members.map((member, index) => {
                const memberId = getMemberId(member);
                const isMe = sameId(memberId, me?.id);
                const isMemberOwner = sameId(memberId, ownerId);
                const canRemove = !isMemberOwner && (isOwner || isMe);

                return (
                  <li key={memberId ?? index} className="member-row">
                    <span className="member-avatar">
                      {getMemberName(member).charAt(0).toUpperCase()}
                    </span>
                    <span className="member-name">
                      {getMemberName(member)}
                      {isMe ? " (you)" : ""}
                      {isMemberOwner && <small>Owner</small>}
                    </span>
                    {canRemove && (
                      <button
                        type="button"
                        className="member-remove"
                        onClick={() => handleRemoveMember(member)}
                        aria-label={isMe ? "Leave playlist" : `Remove ${getMemberName(member)}`}
                        title={isMe ? "Leave playlist" : "Remove"}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isOwner && (
            <form className="member-form" onSubmit={handleAddMember}>
              <label htmlFor="member-email">Invite a friend</label>
              <input
                id="member-email"
                className="dv-input"
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="friend@example.com"
                required
              />
              <button type="submit" className="dashboard-primary-button" disabled={memberBusy}>
                {memberBusy ? "Inviting..." : "Invite"}
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}

export default PlaylistDetails;
