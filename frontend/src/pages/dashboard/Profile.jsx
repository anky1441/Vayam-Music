import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken, getApiErrorMessage } from "../../api/api";
import { getCurrentUser, updateProfile } from "../../api/musicApi";
import "./Profile.css";

const PHOTO_KEY = "vayam-profile-photo";

function Profile({ playlists = [] }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  // Photo stays in this browser until the backend has an upload endpoint.
  const [photo, setPhoto] = useState(() => localStorage.getItem(PHOTO_KEY) || "");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");

  // Load the profile from the backend.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await getCurrentUser();
        const user = response.data?.user ?? response.data;

        if (!active) return;
        setName(user?.name || "");
        setEmail(user?.email || "");
        setBio(user?.bio || "");
      } catch (error) {
        if (active) {
          setLoadError(getApiErrorMessage(error, "Could not load your profile."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      if (typeof imageData === "string") {
        try {
          localStorage.setItem(PHOTO_KEY, imageData);
          setPhoto(imageData);
        } catch {
          alert("This image is too large to save. Please choose a smaller image.");
        }
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaveError("");

    const cleanName = draftName.trim();
    const cleanBio = draftBio.trim();

    if (!cleanName) {
      setSaveError("Please enter your name.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: cleanName, bio: cleanBio });
      setName(cleanName);
      setBio(cleanBio);
      setEditing(false);
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    setDraftName(name);
    setDraftBio(bio);
    setSaveError("");
    setEditing(true);
  }

  function cancelEditing() {
    setSaveError("");
    setEditing(false);
  }

  function handleLogout() {
    clearToken();
    localStorage.removeItem(PHOTO_KEY);
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <section className="profile-view">
        <p className="dashboard-subtitle">Loading your profile...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="profile-view">
        <p className="dashboard-subtitle" role="alert">{loadError}</p>
        <button className="profile-logout-button" onClick={handleLogout}>
          <span aria-hidden="true">↪</span> Logout
        </button>
      </section>
    );
  }

  const displayName = name || "Music Lover";

  return (
    <section className="profile-view">
      <div className="profile-top">
        <p className="dashboard-eyebrow">YOUR SPACE</p>
        <h1>My Profile</h1>
        <p className="dashboard-subtitle">
          Your music, your playlists, your vibe.
        </p>
      </div>

      <div className="profile-card">
        <div className="profile-photo-column">
          <div className="profile-photo">
            {photo ? (
              <img src={photo} alt={`${displayName}'s profile`} />
            ) : (
              <span>{displayName.trim().charAt(0).toUpperCase() || "♫"}</span>
            )}
          </div>

          <label className="profile-photo-button">
            Change Photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
        </div>

        <div className="profile-information">
          {editing ? (
            <form className="profile-edit-form" onSubmit={saveProfile}>
              <label htmlFor="profile-name">Your name</label>
              <input
                id="profile-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={60}
                required
              />

              <label htmlFor="profile-bio">Short bio</label>
              <textarea
                id="profile-bio"
                value={draftBio}
                onChange={(event) => setDraftBio(event.target.value)}
                maxLength={180}
                rows={3}
                placeholder="Tell us about your music vibe..."
              />

              {saveError && <p role="alert">{saveError}</p>}

              <div className="profile-actions">
                <button className="profile-edit-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="profile-cancel-button"
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{displayName}</h2>
              {email && <p className="profile-username">{email}</p>}
              <p className="profile-bio">{bio || "No bio added yet."}</p>

              <div className="profile-actions">
                <button className="profile-edit-button" onClick={startEditing}>
                  Edit Profile
                </button>

                <button className="profile-logout-button" onClick={handleLogout}>
                  <span aria-hidden="true">↪</span> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="profile-playlists-section">
        <div className="profile-section-heading">
          <div>
            <p className="dashboard-eyebrow">YOUR COLLECTION</p>
            <h2>Your Playlists</h2>
          </div>
          <span>{playlists.length} playlists</span>
        </div>

        {playlists.length === 0 ? (
          <div className="profile-empty">
            <span>♫</span>
            <h3>Your playlists will appear here</h3>
            <p>Create your first playlist from the sidebar to see it here.</p>
          </div>
        ) : (
          <div className="profile-playlist-grid">
            {playlists.map((playlist, index) => (
              <article className="profile-playlist-card" key={playlist.id}>
                <div className={`profile-playlist-art profile-art-${index % 4}`}>
                  <span>♫</span>
                </div>
                <div className="profile-playlist-details">
                  <h3>{playlist.name}</h3>
                  <p>{playlist.songs?.length || 0} songs</p>
                  {playlist.description && <p>{playlist.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default Profile;