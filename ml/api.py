
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from recommender import (
    recommend_similar,
    recommend_by_mood,
    generate_playlist,
)

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
