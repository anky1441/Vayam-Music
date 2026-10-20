from pathlib import Path

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


def recommend_similar(song_name, number=5):
    """Recommend songs similar to the given song."""

    matches = songs[
        songs["track_name"].str.contains(
            song_name, case=False, na=False, regex=False
        )
    ]

    if matches.empty:
        return {"error": "Song not found"}

    position = matches.index[0]

    distances, indices = model.kneighbors(
        X[position], n_neighbors=min(number + 1, len(songs))
    )

    recommendations = [
        i for i in indices[0] if i != position
    ][:number]

    result = songs.iloc[recommendations][
        ["track_name", "artists", "track_genre"]
    ]

    return result.to_dict(orient="records")


def recommend_by_mood(mood, number=10):
    """Recommend songs based on the selected mood."""

    mood_targets = {
        "happy": {
            "valence": 0.80,
            "energy": 0.75,
            "danceability": 0.75
        },
        "sad": {
            "valence": 0.20,
            "energy": 0.35,
            "danceability": 0.40
        },
        "relaxed": {
            "valence": 0.55,
            "energy": 0.25,
            "danceability": 0.45
        },
        "energetic": {
            "valence": 0.65,
            "energy": 0.90,
            "danceability": 0.70
        },
        "focus": {
            "valence": 0.50,
            "energy": 0.35,
            "danceability": 0.40
        }
    }

    mood = mood.lower().strip()

    if mood not in mood_targets:
        return {
            "error": "Choose happy, sad, relaxed, energetic, or focus"
        }

    targets = mood_targets[mood]
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

#playlist generator 



def generate_playlist(mood, number=15, genre=None):
    """Generate a mood-based playlist with duplicate removal and artist variety."""

    mood_targets = {
        "happy":     {"valence": 0.80, "energy": 0.75, "danceability": 0.75},
        "sad":       {"valence": 0.20, "energy": 0.35, "danceability": 0.40},
        "relaxed":   {"valence": 0.55, "energy": 0.25, "danceability": 0.45},
        "energetic": {"valence": 0.65, "energy": 0.90, "danceability": 0.70},
        "focus":     {"valence": 0.50, "energy": 0.35, "danceability": 0.40}
    }

    mood = mood.lower().strip()

    if mood not in mood_targets:
        return {"error": "Choose happy, sad, relaxed, energetic, or focus"}

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

    targets = mood_targets[mood]
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


