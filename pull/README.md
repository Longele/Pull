# PULL

> Extract anything. Everywhere.

A cinematic-grade video downloader powered by **yt-dlp**, built with **FastAPI** + **React**.

---

## Stack

| Layer    | Tech                                |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS v3, Framer Motion |
| Backend  | Python 3.11+, FastAPI, yt-dlp, sse-starlette, aiosqlite |
| Fonts    | Instrument Serif, DM Sans, JetBrains Mono (Google Fonts) |

---

## Setup

### 1. Prerequisites

- **Python 3.11+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **yt-dlp** — installed via pip (see below)

---

### 2. Backend

```bash
cd pull/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 5050
```

The API will be live at `http://localhost:5050`.

---

### 3. Frontend

```bash
cd pull/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 4. Cookies for Private/Age-Restricted Content

To download from Instagram, Twitter/X (private), or age-restricted YouTube videos, export your browser cookies and place the file at:

```
pull/cookies.txt
```

Use a browser extension like **Get cookies.txt LOCALLY** (Chrome/Firefox) to export in Netscape format. The backend will automatically detect and pass it to yt-dlp.

> ⚠️ **Never share your cookies.txt file.** It contains your login session.

---

## Supported Sites

PULL supports **1000+ sites** via yt-dlp, including:

- YouTube
- Instagram
- TikTok
- Twitter / X
- Vimeo
- Facebook
- Twitch (VODs & clips)
- SoundCloud
- Reddit
- Dailymotion
- And many more → [Full list](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/info?url=...` | GET | Fetch video metadata (title, thumbnail, duration, formats) |
| `/download/stream` | GET (SSE) | Stream yt-dlp download output in real time |
| `/history` | GET | Return last 10 downloads from local SQLite DB |

### `/download/stream` Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `url` | string | required | Video URL |
| `format` | string | `mp4` | `mp4`, `mp3`, `webm` |
| `quality` | string | `720p` | `480p`, `720p`, `1080p`, `4K` |
| `subtitles` | bool | `false` | Extract and embed subtitles |
| `embed_thumbnail` | bool | `false` | Embed cover art in audio files |
| `audio_only` | bool | `false` | Override format to audio-only MP3 |

---

## Downloaded Files

Files are saved to `pull/downloads/` automatically.

---

## Troubleshooting

**`yt-dlp not found`** → Run `pip install yt-dlp` or `pip install -r requirements.txt`

**CORS errors** → Make sure the backend is running on port 5050 before starting the frontend.

**Instagram / private content fails** → Add a valid `cookies.txt` (see above).

**4K downloads require merging** → Ensure `ffmpeg` is installed and in your PATH. Download from [ffmpeg.org](https://ffmpeg.org).
