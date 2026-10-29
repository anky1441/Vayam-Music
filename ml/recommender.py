from pathlib import Path
import re
import joblib
import pandas as pd
from scipy.sparse import csr_matrix, hstack


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


artifacts = joblib.load(MODEL_DIR / "vayam_recommender.pkl")

model = artifacts["similar_song_model"]
scaler = artifacts["scaler"]
genre_vectorizer = artifacts["genre_vectorizer"]
audio_features = artifacts["audio_features"]

songs = pd.read_csv(MODEL_DIR / "vayam_cleaned_songs.csv")


X_audio = songs[audio_features].copy()
X_audio = X_audio.fillna(X_audio.median())

audio_scaled = scaler.transform(X_audio)

genre_matrix = genre_vectorizer.transform(
    songs["track_genre"].fillna("").astype(str)
)

X = hstack(
    [csr_matrix(audio_scaled), genre_matrix],
    format="csr"
)


def clean_song_name(name):
    """Normalize song title by stripping extraneous bracketed labels, featured artists, and channel tags."""
    if not name or not isinstance(name, str):
        return ""
    cleaned = re.sub(r"\(.*?\)|\[.*?\]", "", name)
    cleaned = re.sub(r"(?i)\b(feat|ft)\.?\b.*", "", cleaned)
    if " - " in cleaned:
        cleaned = cleaned.split(" - ")[-1]
    return cleaned.strip()


def recommend_similar(song_name, number=5):
    """Recommend songs similar to the given song using NearestNeighbors and audio/genre vectors."""
    cleaned = clean_song_name(song_name)
    query = cleaned if cleaned else (song_name or "").strip()

    # 1. Exact or substring match on cleaned title
    matches = songs[
        songs["track_name"].str.contains(
            query, case=False, na=False, regex=False
        )
    ]

    # 2. If no match, try individual words if long enough
    if matches.empty and len(query.split()) > 1:
        first_word = query.split()[0]
        if len(first_word) > 2:
            matches = songs[
                songs["track_name"].str.contains(
                    first_word, case=False, na=False, regex=False
                )
            ]

    # 3. If still empty, fall back to top popular tracks from catalog
    if matches.empty:
        top_songs = songs.sort_values(by="popularity", ascending=False).head(number)
        return top_songs[["track_name", "artists", "track_genre"]].to_dict(orient="records")

    position = matches.index[0]
    matched_title = str(matches.iloc[0]["track_name"]).strip().lower()

    # Query neighbors (over-fetch to allow deduplication)
    n_search = min(max(number * 4, 20), len(songs))
    distances, indices = model.kneighbors(X[position], n_neighbors=n_search)

    recommendations = []
    seen_titles = {matched_title}

    for i in indices[0]:
        if i == position:
            continue
        row = songs.iloc[i]
        t_name = str(row["track_name"]).strip()
        t_key = t_name.lower()
        if t_key in seen_titles:
            continue
        seen_titles.add(t_key)
        recommendations.append({
            "track_name": t_name,
            "artists": str(row["artists"]),
            "track_genre": str(row.get("track_genre", "Pop")),
        })
        if len(recommendations) >= number:
            break

    return recommendations


MOOD_TARGETS = {
    "happy":     {"valence": 0.80, "energy": 0.75, "danceability": 0.75},
    "sad":       {"valence": 0.20, "energy": 0.35, "danceability": 0.40},
    "relaxed":   {"valence": 0.55, "energy": 0.25, "danceability": 0.45},
    "chill":     {"valence": 0.55, "energy": 0.25, "danceability": 0.45},
    "energetic": {"valence": 0.65, "energy": 0.90, "danceability": 0.70},
    "focus":     {"valence": 0.50, "energy": 0.35, "danceability": 0.40},
    "romantic":  {"valence": 0.65, "energy": 0.45, "danceability": 0.55},
}

MOOD_ALIASES = {
    "calm": "relaxed",
    "peaceful": "relaxed",
    "love": "romantic",
    "workout": "energetic",
    "gym": "energetic",
    "study": "focus",
    "work": "focus",
}

def resolve_mood(mood: str):
    m = (mood or "").lower().strip()
    return MOOD_ALIASES.get(m, m)


def recommend_by_mood(mood, number=10):
    """Recommend songs based on the selected mood."""
    resolved = resolve_mood(mood)
    if resolved not in MOOD_TARGETS:
        return {
            "error": f"Invalid mood '{mood}'. Choose happy, sad, relaxed, chill, energetic, focus, or romantic."
        }

    targets = MOOD_TARGETS[resolved]
    scores = 0

    for feature, target in targets.items():
        scores += (
            songs[feature].fillna(songs[feature].median()) - target
        ) ** 2

    selected = scores.nsmallest(number).index

    return songs.loc[selected, [
        "track_name",
        "artists",
        "track_genre"
    ]].to_dict(orient="records")


def generate_playlist(mood, number=15, genre=None):
    """Generate a mood-based playlist with duplicate removal and artist variety."""
    resolved = resolve_mood(mood)
    if resolved not in MOOD_TARGETS:
        return {"error": f"Invalid mood '{mood}'. Choose happy, sad, relaxed, chill, energetic, focus, or romantic."}

    if not isinstance(number, int) or isinstance(number, bool) or number < 1:
        return {"error": "Playlist size must be a positive integer"}

    if number > 100:
        return {"error": "Choose at most 100 songs"}

    candidates = songs.copy()

    if genre:
        candidates = candidates[
            candidates["track_genre"].str.contains(
                genre, case=False, na=False, regex=False
            )
        ]

    if candidates.empty:
        return {"error": "No songs found for this genre"}

    # Remove duplicate song titles
    candidates = candidates.drop_duplicates(
        subset=["track_name"], keep="first"
    ).copy()

    targets = MOOD_TARGETS[resolved]
    scores = 0

    for feature, target in targets.items():
        values = candidates[feature].fillna(
            candidates[feature].median()
        )
        scores += (values - target) ** 2

    candidates["mood_score"] = scores
    candidates = candidates.sort_values("mood_score")

    # Prefer different artists among the best mood matches
    unique_artists = candidates.drop_duplicates(subset=["artists"])
    playlist = unique_artists.head(number)

    # If needed, fill remaining slots with other songs
    if len(playlist) < min(number, len(candidates)):
        remaining = candidates.drop(index=playlist.index)
        playlist = pd.concat([
            playlist,
            remaining.head(number - len(playlist))
        ])

    # Prepare playlist details with song durations
    result = playlist[
        ["track_name", "artists", "track_genre", "duration_ms"]
    ].copy()

    result["duration_seconds"] = (
        pd.to_numeric(result["duration_ms"], errors="coerce") / 1000
    ).round().astype("Int64")

    total_duration_seconds = int(
        result["duration_seconds"].fillna(0).sum()
    )

    songs_data = result.drop(columns=["duration_ms"]).copy()
    songs_data["duration_seconds"] = (
        songs_data["duration_seconds"].astype(object)
    )
    songs_data = songs_data.where(pd.notna(songs_data), None)

    return {
        "mood": mood,
        "total_songs": len(songs_data),
        "total_duration_seconds": total_duration_seconds,
        "total_duration_minutes": round(total_duration_seconds / 60, 2),
        "songs": songs_data.to_dict(orient="records")
    }
