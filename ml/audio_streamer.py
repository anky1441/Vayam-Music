"""
Audio stream extraction module for Vayam Music.
Uses yt-dlp to extract high-quality, ad-free direct audio streams
with in-memory caching and background pre-warming.
"""

import sys
import threading
import time
from typing import Dict, Any, Optional
import yt_dlp

_STREAM_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_LOCK = threading.Lock()


def _normalize_key(title: str, artist: str = "") -> str:
    return f"{title.strip().lower()}:::{artist.strip().lower()}"


def get_audio_stream(title: str, artist: str = "") -> Dict[str, Any]:
    """
    Resolves a direct ad-free audio stream URL for a song title + artist.
    Checks memory cache first for near-instant (0.001s) subsequent loads.
    """
    t0 = time.time()
    clean_title = (title or "").strip()
    clean_artist = (artist or "").strip()
    key = _normalize_key(clean_title, clean_artist)

    with _CACHE_LOCK:
        if key in _STREAM_CACHE:
            cached = _STREAM_CACHE[key]
            # Verify stream URL hasn't expired (YouTube URLs usually valid for 6+ hours)
            if time.time() - cached.get("cached_at", 0) < 18000:
                elapsed = time.time() - t0
                print(f"[STREAM CACHE HIT] '{clean_title}' by '{clean_artist}' -> instant response ({elapsed:.4f}s)", flush=True)
                return cached["data"]

    search_query = f"{clean_title} {clean_artist} audio".strip()
    print(f"[STREAM EXTRACT] Fetching YouTube audio stream for: '{search_query}'...", flush=True)

    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 12,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "ios", "mweb", "web"]
            }
        },
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch1:{search_query}", download=False)
            if not info or "entries" not in info or not info["entries"]:
                print(f"[STREAM WARNING] No stream found for '{clean_title}'", flush=True)
                return {"error": f"No audio stream found for '{clean_title}'"}

            entry = info["entries"][0]
            stream_url = entry.get("url")
            if not stream_url:
                print(f"[STREAM WARNING] No playable URL for '{clean_title}'", flush=True)
                return {"error": "Failed to extract playable audio stream URL"}

            result = {
                "title": entry.get("title") or clean_title,
                "artist": clean_artist or entry.get("uploader", "Unknown Artist"),
                "stream_url": stream_url,
                "duration": entry.get("duration") or 0,
                "thumbnail": entry.get("thumbnail") or "",
                "video_id": entry.get("id") or "",
            }

            with _CACHE_LOCK:
                _STREAM_CACHE[key] = {
                    "data": result,
                    "cached_at": time.time(),
                }

            elapsed = time.time() - t0
            print(f"[STREAM SUCCESS] '{clean_title}' resolved & cached in {elapsed:.2f}s (duration: {result['duration']}s)", flush=True)
            return result
    except Exception as e:
        print(f"[STREAM ERROR] Extraction failed for '{clean_title}': {str(e)}", flush=True)
        return {"error": f"Stream extraction failed: {str(e)}"}


def prewarm_cache(songs: list):
    """
    Runs in a background thread to pre-fetch stream URLs for sample/trending songs.
    """
    def _worker():
        print(f"[PREWARM] Background pre-warming {len(songs)} tracks into memory cache...", flush=True)
        for song in songs:
            title = song.get("title")
            artist = song.get("artist", "")
            if title:
                try:
                    get_audio_stream(title, artist)
                except Exception:
                    pass
        print(f"[PREWARM] Cache pre-warming complete! Tracks ready for instant playback.", flush=True)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
