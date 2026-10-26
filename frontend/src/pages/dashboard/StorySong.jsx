import { useState } from "react";
import { getApiErrorMessage } from "../../api/api";
import { createStorySong } from "../../api/musicApi";
import SongRow from "../../components/SongRow";
import { getMood } from "../../constants/moods";
import { toList, unwrapSong } from "../../utils/music";
import "./DashboardContent.css";
import "./Discover.css";

const MAX_LENGTH = 600;

const EXAMPLES = [
  "It's raining outside, I have a cup of chai and nothing to do tonight.",
  "Last day of college. Everyone is laughing and I don't want it to end.",
  "Driving back home late at night after a long, tiring week.",
];

// StorySong: tell a short story, get songs that fit it. POST /storysong
function StorySong({ onOpenSong, isLiked, onToggleLike }) {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = story.trim();

    if (text.length < 10) {
      setError("Tell us a little more - at least a sentence.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // ASSUMED request body - rename the field here if your DTO differs.
      const response = await createStorySong({ story: text });
      const data = response.data ?? {};

      const songs = (
        data.song && typeof data.song === "object"
          ? [data.song]
          : toList(data.songs ?? data.recommendations ?? data)
      )
        .map(unwrapSong)
        .filter((song) => song?.title);

      setResult({
        mood: data.mood ?? data.detectedMood ?? data.emotion ?? "",
        message: data.message ?? data.summary ?? "",
        songs,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not find a song for your story. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  const detected = result?.mood ? getMood(result.mood) : null;

  return (
    <section className="dashboard-view">
      <p className="dashboard-eyebrow">YOUR STORY, YOUR SOUNDTRACK</p>
      <h1>StorySong</h1>
      <p className="dashboard-subtitle">
        Describe a moment in a few lines and Vayam finds the songs that sound like it.
      </p>

      <form className="playlist-form" onSubmit={handleSubmit}>
        <label htmlFor="story-text">Your story</label>
        <textarea
          id="story-text"
          value={story}
          onChange={(event) => {
            setStory(event.target.value);
            setError("");
          }}
          placeholder="e.g. It's raining outside, I have a cup of chai and nothing to do tonight..."
          rows={6}
          maxLength={MAX_LENGTH}
        />
        <p className="dv-counter">{story.length} / {MAX_LENGTH}</p>

        <div className="chip-row">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="chip chip-example"
              onClick={() => setStory(example)}
            >
              {example}
            </button>
          ))}
        </div>

        {error && <p className="dv-error" role="alert">{error}</p>}

        <button className="dashboard-primary-button" type="submit" disabled={loading}>
          {loading ? "Listening to your story..." : "✎ Find my songs"}
        </button>
      </form>

      {result && (
        <div className="dv-result">
          <p className="dashboard-eyebrow">WE HEARD</p>
          <h2>
            {detected ? `${detected.icon} ${detected.label}` : result.mood || "Your story"}
          </h2>
          {result.message && <p className="dashboard-subtitle">{result.message}</p>}

          {result.songs.length === 0 ? (
            <div className="dashboard-empty">
              <span className="dashboard-big-icon">♫</span>
              <h2>No songs matched this story</h2>
              <p>Try adding a few more details about how it feels.</p>
            </div>
          ) : (
            <div className="dashboard-song-list">
              {result.songs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  liked={isLiked(song.id)}
                  onToggleLike={onToggleLike}
                  onOpen={onOpenSong}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default StorySong;
