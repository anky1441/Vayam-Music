import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CollabPlaylists.css";

/* ---------- API setup ---------- */
// Vite: VITE_API_URL in .env   |   Create React App: use process.env.REACT_APP_API_URL
const API = import.meta.env.VITE_API_BASE_URL || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`, // change if you store the token differently
});

/* ---------- Helpers: tolerate different field names from the backend ---------- */
const memberId = (m) => m.id ?? m.userId ?? m.user?.id;
const memberName = (m) => m.name || m.username || m.user?.name || m.user?.username || "User";

const normalize = (p, members) => ({
  id: p.id,
  name: p.name || p.title || "Untitled playlist",
  description: p.description || "",
  ownerId: p.ownerId ?? p.owner?.id ?? p.userId,
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
          key={memberId(m) ?? i}
          className="cp-avatar"
          title={memberName(m)}
          style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: 10 - i }}
        >
          {memberName(m).charAt(0).toUpperCase()}
        </span>
      ))}
      {extra > 0 && <span className="cp-avatar cp-avatar-extra">+{extra}</span>}
    </div>
  );
}

export default function CollabPlaylists() {
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
      const [meRes, plRes] = await Promise.all([
        fetch(`${API}/api/users/me`, { headers: authHeaders() }),
        fetch(`${API}/api/users/me/playlists`, { headers: authHeaders() }),
      ]);

      if (meRes.status === 401 || plRes.status === 401) {
        navigate("/login");
        return;
      }
      if (!meRes.ok || !plRes.ok) throw new Error("Request failed");

      const meData = await meRes.json();
      const raw = await plRes.json();
      const list = Array.isArray(raw) ? raw : raw.content || raw.playlists || [];

      // If the playlist object has no members, fetch them for each playlist
      const full = await Promise.all(
        list.map(async (p) => {
          if (Array.isArray(p.members)) return normalize(p);
          try {
            const r = await fetch(`${API}/api/playlists/${p.id}/members`, { headers: authHeaders() });
            const m = r.ok ? await r.json() : [];
            return normalize(p, Array.isArray(m) ? m : m.content || []);
          } catch {
            return normalize(p, []);
          }
        })
      );

      setMe(meData);
      setPlaylists(full);
    } catch {
      setLoadError("Could not load your playlists. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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
      const res = await fetch(`${API}/api/playlists`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      const meMember = me ? [{ id: me.id, name: me.name || me.username || "You" }] : [];
      setPlaylists((prev) => [normalize({ ownerId: me?.id, ...created }, created.members || meMember), ...prev]);
      closeModal();
    } catch {
      setFormError("Could not create the playlist. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Filtering ---------- */
  const isOwner = (p) => me && p.ownerId === me.id;
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

  return (
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
}