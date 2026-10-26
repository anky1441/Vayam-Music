import io
import json
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image
import pandas as pd
import requests

# load api credentials from .env
load_dotenv()
ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")
API_URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct"

# setup requests session with token
session = requests.Session()
session.headers.update({"Authorization": f"Bearer {API_TOKEN}"})

# load spotify dataset with only the columns we actually need
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "models" / "vayam_cleaned_songs.csv"
if not DATA_PATH.exists():
    DATA_PATH = BASE_DIR / "vayam_cleaned_songs.csv"

NEEDED_COLUMNS = ["track_name", "artists", "track_genre", "energy", "valence", "popularity"]
songs = pd.read_csv(DATA_PATH, usecols=NEEDED_COLUMNS)


# resize image so it uploads fast and convert into bytes
def compress_image(image_input, max_size=(384, 384)) -> list:
    if isinstance(image_input, (str, Path)):
        img = Image.open(image_input).convert("RGB")
    else:
        img = Image.open(io.BytesIO(image_input)).convert("RGB")
    
    img.thumbnail(max_size)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return list(buf.getvalue())


# send image and prompt to llama vision to get mood scores and description
def extract_story_vibe(image_input, vibe_text: str = "") -> dict:
    image_bytes = compress_image(image_input)

    prompt = f"""Analyze this image and the user's vibe description: "{vibe_text}".
Return ONLY a valid JSON object (no markdown, no extra text) with these keys:
{{
  "story": "1-2 sentence atmospheric description",
  "valence": 0.5,
  "energy": 0.5,
  "suggested_genre": "ambient"
}}"""

    payload = {
        "image": image_bytes,
        "prompt": prompt,
        "max_tokens": 200,
    }

    response = session.post(API_URL, json=payload, timeout=25)

    if response.status_code != 200:
        raise Exception(
            f"Vision API error: {response.status_code} - {response.text[:1000]}"
        )

    res_json = response.json()
    result_data = res_json.get("result", {})

    if isinstance(result_data, dict):
        result_text = result_data.get("response", "")
    else:
        result_text = str(result_data)

    if isinstance(result_text, dict):
        parsed = result_text
    else:
        match = re.search(r"\{.*\}", str(result_text), re.DOTALL)
        parsed = {}

        if match:
            try:
                parsed = json.loads(match.group(0))
            except (json.JSONDecodeError, TypeError):
                pass

    if isinstance(parsed, dict) and parsed:
        try:
            valence = float(parsed.get("valence", 0.5))
            energy = float(parsed.get("energy", 0.5))

            return {
                "story": str(parsed.get("story", "Atmospheric vibe")),
                "valence": max(0.0, min(1.0, valence)),
                "energy": max(0.0, min(1.0, energy)),
                "suggested_genre": str(
                    parsed.get("suggested_genre", "ambient")
                ),
            }
        except (ValueError, TypeError):
            pass

    return {
        "story": str(result_text)[:120].strip()
        or "Atmospheric late-night aesthetic",
        "valence": 0.45,
        "energy": 0.50,
        "suggested_genre": "ambient",
    }


# find matching songs in dataset based on valence and energy distance
def match_story_songs(atmosphere: dict, number: int = 5) -> list:
    target_valence = float(atmosphere.get("valence", 0.5))
    target_energy = float(atmosphere.get("energy", 0.5))

    # calculate distance to target mood
    candidates = songs.copy()
    candidates["distance"] = (
        (candidates["valence"] - target_valence) ** 2 +
        (candidates["energy"] - target_energy) ** 2
    )

    # sort by nearest distance first and popularity
    sorted_songs = candidates.sort_values(by=["distance", "popularity"], ascending=[True, False])

    # avoid repeating the same artist
    unique_artists = sorted_songs.drop_duplicates(subset=["artists"]).head(number)

    return unique_artists[["track_name", "artists", "track_genre", "valence", "energy", "popularity"]].to_dict(orient="records")
