
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from recommender import (
    recommend_similar,
    recommend_by_mood,
    generate_playlist,
)
from audio_streamer import get_audio_stream, prewarm_cache
from test_clip import extract_story_vibe, match_story_songs

app = FastAPI(
    title="Vayam Music ML API",
    description="Music recommendation and AI playlist endpoints",
    version="1.0.0",
)

# Development/testing configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimilarSongRequest(BaseModel):
    song_name: str = Field(min_length=1)
    number: int = Field(default=5, ge=1, le=20)


class MoodRequest(BaseModel):
    mood: str
    number: int = Field(default=10, ge=1, le=100)


class PlaylistRequest(BaseModel):
    mood: str
    number: int = Field(default=15, ge=1, le=100)
    genre: str = ""


@app.get("/")
def home():
    return {
        "project": "Vayam Music",
        "message": "ML API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommend/similar")
def similar_songs(request: SimilarSongRequest):
    result = recommend_similar(
        request.song_name.strip(),
        request.number,
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return {
        "feature": "similar_song_recommendation",
        "query": request.song_name,
        "recommendations": result,
    }


@app.post("/recommend/mood")
def mood_recommendations(request: MoodRequest):
    result = recommend_by_mood(
        request.mood.strip().lower(),
        number=request.number,
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {
        "feature": "mood_based_recommendation",
        "mood": request.mood,
        "recommendations": result,
    }


@app.post("/playlist/generate")
def create_playlist(request: PlaylistRequest):
    genre = request.genre.strip() or None

    result = generate_playlist(
        mood=request.mood.strip().lower(),
        number=request.number,
        genre=genre,
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.get("/audio/stream")
def stream_audio(title: str, artist: str = ""):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Song title is required")
    res = get_audio_stream(title.strip(), artist.strip())
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@app.on_event("startup")
def startup_event():
    sample_tracks = [
        {"title": "Blinding Lights", "artist": "The Weeknd"},
        {"title": "Starboy", "artist": "The Weeknd"},
        {"title": "Shape of You", "artist": "Ed Sheeran"},
        {"title": "Sweater Weather", "artist": "The Neighbourhood"},
    ]
    prewarm_cache(sample_tracks)

@app.post("/storysong/match")
async def storysong_match(
    file: UploadFile = File(...),
    vibe: str = Form(""),
    number: int = Form(5),
):
    #Feature 4
    try:
        image_bytes = await file.read()
        vibe_data = extract_story_vibe(image_bytes, vibe_text=vibe)
        recommendations = match_story_songs(vibe_data, number=number)
        return {
            "feature": "storysong_matcher",
            "vibe_query": vibe,
            "atmosphere": vibe_data,
            "recommendations": recommendations,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"StorySong matching failed: {str(e)}")


import concurrent.futures
import json
import urllib.parse
import urllib.request

_ARTWORK_CACHE = {}


def fetch_track_artwork(title: str, artist: str) -> str:
    """Fetch high-res album artwork from Apple Music/iTunes catalog with caching."""
    clean_title = (title or "").strip()
    clean_artist = (artist or "").strip()
    cache_key = f"{clean_title.lower()}_{clean_artist.lower()}"

    if cache_key in _ARTWORK_CACHE:
        return _ARTWORK_CACHE[cache_key]

    # Primary query: track title + artist
    search_queries = [
        f"{clean_title} {clean_artist}".strip(),
        clean_title,
    ]

    for term in search_queries:
        if not term:
            continue
        try:
            url = f"https://itunes.apple.com/search?term={urllib.parse.quote(term)}&entity=song&limit=1"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results", [])
                if results and "artworkUrl100" in results[0]:
                    art_url = results[0]["artworkUrl100"].replace("100x100bb", "600x600bb")
                    _ARTWORK_CACHE[cache_key] = art_url
                    return art_url
        except Exception:
            continue

    _ARTWORK_CACHE[cache_key] = ""
    return ""


@app.get("/songs/search")
def search_catalog_songs(query: str, limit: int = 10):
    if not query or not query.strip():
        return []

    q = query.strip()
    from test_clip import songs

    # 1. Search in-memory 114k Spotify dataset
    mask = songs["track_name"].str.contains(q, case=False, na=False) | songs["artists"].str.contains(q, case=False, na=False)
    matches = (
        songs[mask]
        .drop_duplicates(subset=["track_name", "artists"])
        .sort_values(by="popularity", ascending=False)
        .head(limit)
    )

    results = []
    for _, row in matches.iterrows():
        results.append({
            "id": f"ds_{row['track_name']}_{row['artists']}",
            "title": str(row["track_name"]),
            "artist": str(row["artists"]),
            "genre": str(row.get("track_genre", "Pop")),
            "popularity": int(row.get("popularity", 50)),
            "coverUrl": "",
            "audioUrl": "",
        })

    # 2. If fewer than 2 results found in dataset, search YouTube in background via yt-dlp flat extract
    if len(results) < 2:
        try:
            import yt_dlp
            ydl_opts = {"quiet": True, "extract_flat": True, "skip_download": True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                yt_res = ydl.extract_info(f"ytsearch{limit}:{q} audio", download=False)
                for entry in yt_res.get("entries", []):
                    title = entry.get("title") or ""
                    uploader = entry.get("uploader") or entry.get("channel") or ""
                    thumbnails = entry.get("thumbnails")
                    thumb_url = thumbnails[-1].get("url") if thumbnails else ""
                    if title:
                        results.append({
                            "id": f"yt_{entry.get('id', title)}",
                            "title": title,
                            "artist": uploader,
                            "genre": "Live Stream",
                            "popularity": 75,
                            "coverUrl": thumb_url,
                            "audioUrl": "",
                        })
        except Exception:
            pass

    # 3. Resolve HD album artwork in parallel for dataset matches that lack a coverUrl
    tracks_to_fetch = [r for r in results[:limit] if not r.get("coverUrl")]
    if tracks_to_fetch:
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(tracks_to_fetch))) as executor:
            future_to_track = {
                executor.submit(fetch_track_artwork, r["title"], r["artist"]): r
                for r in tracks_to_fetch
            }
            for future in concurrent.futures.as_completed(future_to_track):
                track = future_to_track[future]
                try:
                    track["coverUrl"] = future.result()
                except Exception:
                    pass

    return results[:limit]

