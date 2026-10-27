import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getApiErrorMessage } from "../api/api";
import {
  createPlaylist,
  getCurrentUser,
  getMyPlaylists,
  getPlaylistMembers,
} from "../api/musicApi";
import {
  getMemberId,
  getMemberName,
  getOwnerId,
  getUser,
  sameId,
  toList,
} from "../utils/music";
import "./Home.css";
import "./CollabPlaylists.css";

const normalize = (p, members) => ({
  id: p.id,
  name: p.name || p.title || "Untitled playlist",
  description: p.description || "",
  ownerId: getOwnerId(p),
  songCount: p.songCount ?? p.songs?.length ?? 0,
  members: members ?? p.members ?? [],
});

const AVATAR_COLORS = ["#8b5cf6", "#d946ef", "#6366f1", "#ec4899", "#14b8a6"];

function AvatarStack({ members }) {
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="cp-avatars">
      {shown.map((m, i) => (
        <span
          key={getMemberId(m) ?? i}
          className="cp-avatar"
          title={getMemberName(m)}
          style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: 10 - i }}
        >
          {getMemberName(m).charAt(0).toUpperCase()}
        </span>
      ))}
      {extra > 0 && <span className="cp-avatar cp-avatar-extra">+{extra}</span>}
    </div>
  );
}

export default function CollabPlaylists({ isEmbedded = false }) {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("all"); // all | owned | shared

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------- Load current user + playlists + members ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [meRes, plRes] = await Promise.all([getCurrentUser(), getMyPlaylists()]);
      const list = toList(plRes.data);

      // Fetch the members of each playlist (skipped when the playlist already has them)
      const full = await Promise.all(
        list.map(async (p) => {
          if (Array.isArray(p.members)) return normalize(p);
          try {
            const r = await getPlaylistMembers(p.id);
            return normalize(p, toList(r.data));
          } catch {
            return normalize(p, []);
          }
        })
      );

      setMe(getUser(meRes));
      setPlaylists(full);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Could not load your playlists. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- Modal ---------- */
  const closeModal = useCallback(() => {
    setShowModal(false);
    setName("");
    setDescription("");
    setFormError("");
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, closeModal]);

  /* ---------- Create playlist: POST /api/playlists ---------- */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Please give your playlist a name.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await createPlaylist({ name: name.trim(), description: description.trim() });
      const created = res.data?.playlist ?? res.data;
      const meMember = me ? [{ id: me.id, name: me.name || me.username || "You" }] : [];
      setPlaylists((prev) => [normalize({ ownerId: me?.id, ...created }, created.members || meMember), ...prev]);
      closeModal();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create the playlist. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Filtering ---------- */
  const isOwner = (p) => Boolean(me) && sameId(p.ownerId, me.id);
  const visible = playlists.filter((p) => {
    if (tab === "owned") return isOwner(p);
    if (tab === "shared") return !isOwner(p);
    return true;
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "owned", label: "Created by me" },
    { key: "shared", label: "Shared with me" },
  ];

  const pageContent = (
    <div className="cp-page">
      {/* Header */}
      <div className="cp-header">
        <div>
          <span className="cp-label">COLLABORATIVE PLAYLISTS</span>
          <h1>Build playlists together</h1>
          <p>Create a shared playlist, invite friends, and let everyone add their songs.</p>
        </div>
        <button className="cp-create-btn" onClick={() => setShowModal(true)}>
          ＋ Create Shared Playlist
        </button>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`cp-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="cp-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="cp-card cp-skeleton" />
          ))}
        </div>
      )}

      {/* Load error */}
      {!loading && loadError && (
        <div className="cp-empty">
          <span className="cp-empty-icon">⚠️</span>
          <h3>Something went wrong</h3>
          <p>{loadError}</p>
          <button className="cp-create-btn" onClick={load}>Try again</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && visible.length === 0 && (
        <div className="cp-empty">
          <span className="cp-empty-icon">👥</span>
          <h3>{tab === "shared" ? "Nothing shared with you yet" : "No playlists here yet"}</h3>
          <p>
            {tab === "shared"
              ? "When a friend adds you to a playlist, it will show up here."
              : "Start one and invite your friends. Every trip needs a soundtrack."}
          </p>
          {tab !== "shared" && (
            <button className="cp-create-btn" onClick={() => setShowModal(true)}>
              ＋ Create your first one
            </button>
          )}
        </div>
      )}

      {/* Playlist cards */}
      {!loading && !loadError && visible.length > 0 && (
        <div className="cp-grid">
          {visible.map((p) => (
            <div
              key={p.id}
              className="cp-card"
              onClick={() => navigate(`/collab/${p.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/collab/${p.id}`)}
            >
              <div className="cp-card-top">
                <span className="cp-card-icon">🎶</span>
                <span className={`cp-role ${isOwner(p) ? "owner" : "member"}`}>
                  {isOwner(p) ? "Owner" : "Member"}
                </span>
              </div>

              <h3>{p.name}</h3>
              <p className="cp-desc">{p.description || "No description yet."}</p>

              <div className="cp-card-bottom">
                <AvatarStack members={p.members} />
                <span className="cp-meta">
                  {p.members.length} {p.members.length === 1 ? "member" : "members"} · {p.songCount} songs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="cp-overlay" onClick={closeModal}>
          <form className="cp-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2>Create Shared Playlist</h2>
            <p className="cp-modal-sub">You can invite friends after creating it.</p>

            <label htmlFor="cp-name">Playlist name</label>
            <input
              id="cp-name"
              type="text"
              placeholder="e.g. Goa Trip Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
            />

            <label htmlFor="cp-desc">Description (optional)</label>
            <textarea
              id="cp-desc"
              placeholder="What is this playlist for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
              rows={3}
            />

            {formError && <span className="cp-error">{formError}</span>}

            <div className="cp-modal-actions">
              <button type="button" className="cp-btn-ghost" onClick={closeModal}>Cancel</button>
              <button type="submit" className="cp-create-btn" disabled={saving}>
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return pageContent;
  }

  return (
    <div className="music-home">
      <Navbar />
      {pageContent}
    </div>
  );
}