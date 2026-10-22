
import { useState } from "react";
import "./DashboardContent.css";

function CreatePlaylist({ songs, onCreatePlaylist }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);

  const filteredSongs = songs.filter((song) =>
    `${song.title} ${song.artist}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function toggleSong(id) {
    setSelectedSongs((current) =>
      current.includes(id)
        ? current.filter((songId) => songId !== id)
        : [...current, id]
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) return;

    onCreatePlaylist({
      name: name.trim(),
      description: description.trim(),
      songs: selectedSongs,
    });
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

        <label htmlFor="playlist-description">
          Description (optional)
        </label>
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

        <p className="dashboard-subtitle">
          {selectedSongs.length} song(s) selected
        </p>

        <div className="dashboard-song-list">
          {filteredSongs.map((song) => {
            const selected = selectedSongs.includes(song.id);

            return (
              <div className="dashboard-song" key={song.id}>
                <div className={`dashboard-song-art ${song.art}`}>
                  ♫
                </div>
                <div className="dashboard-song-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
                <button
                  type="button"
                  className={`dashboard-add-button ${selected ? "selected" : ""}`}
                  onClick={() => toggleSong(song.id)}
                >
                  {selected ? "Added ✓" : "+ Add"}
                </button>
              </div>
            );
          })}

          {filteredSongs.length === 0 && (
            <p className="dashboard-subtitle">
              No matching sample songs found.
            </p>
          )}
        </div>

        <button className="dashboard-primary-button" type="submit">
          Create Playlist
        </button>
      </form>
    </section>
  );
}

export default CreatePlaylist;
