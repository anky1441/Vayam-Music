# Vayam Music - Frontend

React + Vite frontend for the Vayam mood-based music player.

## Run it

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev
```

`.env`

| Variable | What it is |
| --- | --- |
| `VITE_API_BASE_URL` | Backend URL without `/api` (defaults to the Render deployment) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth *Web* client ID. Empty = the Google button shows a "not set up" message |

## Pages

| Page | Where | API used |
| --- | --- | --- |
| Landing | `/` | - |
| Login / Register | `/login`, `/register` | `POST /auth/login`, `/auth/register`, `/auth/google` |
| Home (dashboard) | `/home` | `GET /songs` |
| Mood Selection + mood songs | Home > Moods | `GET /recommendations/mood/{mood}`, `GET /songs/mood/{mood}` |
| Search | Navbar search / Home > Search | `GET /songs/search?query=` |
| Recommendations ("For You") | Home > For You | `GET /recommendations` |
| Song Details | click any song | `GET /songs/{id}`, `GET /recommendations/song/{id}`, `POST /playlists/{id}/songs/{songId}` |
| Liked Songs | Home > Liked Songs | `GET /users/me/likes`, `POST/DELETE /songs/{id}/like` |
| My Playlists / Create | Home > My Playlists | `GET /users/me/playlists`, `POST /playlists`, `POST /playlists/{id}/songs/{songId}` |
| Playlist details | click a playlist | `GET/PUT/DELETE /playlists/{id}`, `GET /playlists/{id}/songs`, `DELETE /playlists/{id}/songs/{songId}` |
| Playlist Generator | Home > Playlist Generator | `POST /playlists/generate` |
| StorySong | Home > StorySong | `POST /storysong` |
| Collab Playlists | `/collab`, `/collab/:id` | `GET /users/me/playlists`, `GET/POST/DELETE /playlists/{id}/members` |
| Profile | Navbar avatar | `GET/PUT /users/me` |

All endpoints are wrapped in `src/api/musicApi.js`.

## Request bodies that are assumed

You did not list request/response bodies, so these are guesses. If your DTOs differ, change them in the one place shown:

| Call | Body sent | Where to change |
| --- | --- | --- |
| `POST /auth/google` | `{ idToken }` | `src/components/GoogleAuthButton.jsx` |
| `POST /playlists/generate` | `{ mood, name, limit }` | `src/pages/dashboard/PlaylistGenerator.jsx` |
| `POST /storysong` | `{ story }` | `src/pages/dashboard/StorySong.jsx` |
| `POST /playlists/{id}/members` | `{ email }` | `src/pages/dashboard/PlaylistDetails.jsx` |

Song fields the UI reads: `id`, `title`, `artist`, `coverUrl`, and optionally `mood`, `genre`, `album`, `duration`, `audioUrl` (for the player on Song Details).
List responses can be a plain array or a wrapped object (`content`, `songs`, `data`...) - see `src/utils/music.js`.

The mood keys (`happy`, `sad`, `chill`, `energetic`, `romantic`, `focus`) live in `src/constants/moods.js` - make them match what your ML team returns.

## Project structure

```
src/
  api/          axios client + every endpoint
  components/   Navbar, Footer, SongCard, SongRow, GoogleAuthButton, landing sections
  constants/    moods
  hooks/        useLibrary (likes + playlists synced with the backend)
  pages/        Home shell, Login, Register, About, Collab pages
  pages/dashboard/  Moods, Search, Recommendations, SongDetails, PlaylistGenerator,
                    StorySong, PlaylistDetails, LikedSongs, MyPlaylists, CreatePlaylists, Profile
  utils/        response-shape helpers
```
