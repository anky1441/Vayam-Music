import { useState } from "react";
import { getApiErrorMessage } from "../../api/api";
import SongRow from "../../components/SongRow";
import { sameId } from "../../utils/music";
import "./DashboardContent.css";

function CreatePlaylist({ songs, onCreatePlaylist }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredSongs = songs.filter((song) =>
    `${song.title} ${song.artist}`.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSong(id) {
    setSelectedSongs((current) =>
      current.some((songId) => sameId(songId, id))
        ? current.filter((songId) => !sameId(songId, id))
        : [...current, id]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError("");

    try {
      await onCreatePlaylist({
        name: name.trim(),
        description: description.trim(),
        songIds: selectedSongs,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not create the playlist. Please try again."));
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">MAKE IT YOURS</p>
      <h1>Create Playlist</h1>
      <p className="dashboard-subtitle">
        Give your playlist a name and choose your songs.
      </p>

      <form className="playlist-form" onSubmit={handleSubmit}>
        <label htmlFor="playlist-name">Playlist name</label>
        <input
          id="playlist-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Late Night Vibes"
          maxLength={60}
          required
        />

        <label htmlFor="playlist-description">Description (optional)</label>
        <textarea
          id="playlist-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is this playlist about?"
          rows={3}
        />

        <h2>Add songs</h2>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search songs or artists..."
          aria-label="Search songs or artists"
        />

        <p className="dashboard-subtitle">{selectedSongs.length} song(s) selected</p>

        <div className="dashboard-song-list">
          {filteredSongs.map((song) => {
            const selected = selectedSongs.some((id) => sameId(id, song.id));

            return (
              <SongRow key={song.id} song={song}>
                <button
                  type="button"
                  className={`dashboard-add-button ${selected ? "selected" : ""}`}
                  onClick={() => toggleSong(song.id)}
                >
                  {selected ? "Added ✓" : "+ Add"}
                </button>
              </SongRow>
            );
          })}

          {filteredSongs.length === 0 && (
            <p className="dashboard-subtitle">No matching songs found.</p>
          )}
        </div>

        {error && <p className="dv-error" role="alert">{error}</p>}

        <button className="dashboard-primary-button" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Playlist"}
        </button>
      </form>
    </section>
  );
}

export default CreatePlaylist;
