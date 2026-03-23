import asyncio
import json
import os
import pathlib
import subprocess
import sys
import threading
from typing import AsyncGenerator

COOKIES_PATH = os.path.join(os.path.dirname(__file__), "..", "cookies.txt")


def get_ytdlp_cmd() -> list[str]:
    """Return the command list to invoke yt-dlp, using the Python module to ensure
    it always matches the running interpreter's installed packages."""
    return [sys.executable, "-m", "yt_dlp"]


def get_gallerydl_cmd() -> list[str]:
    """Return the command list to invoke gallery-dl."""
    return [sys.executable, "-m", "gallery_dl"]


def _build_format_selector(fmt: str, quality: str) -> str:
    """Build a yt-dlp format selector string from user params."""
    if fmt == "mp3":
        return "bestaudio/best"

    quality_map = {
        "480p": "480",
        "720p": "720",
        "1080p": "1080",
        "4k": "2160",
        "4K": "2160",
    }
    height = quality_map.get(quality, "720")

    if fmt == "webm":
        return f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"

    # mp4 default
    return f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"


def _run_info_cmd(cmd: list[str]) -> tuple[str, str, int]:
    """Run yt-dlp info command synchronously (for use in thread executor)."""
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    return result.stdout, result.stderr, result.returncode


async def _fetch_photo_info(url: str) -> dict | None:
    """Try gallery-dl --dump-json to detect photo content. Returns info dict or None."""
    cmd = get_gallerydl_cmd() + ["--dump-json", url]
    if os.path.isfile(COOKIES_PATH):
        cmd += ["--cookies", COOKIES_PATH]

    loop = asyncio.get_running_loop()
    try:
        stdout, stderr, returncode = await loop.run_in_executor(None, _run_info_cmd, cmd)
    except Exception:
        return None

    if returncode != 0 or not stdout.strip():
        stderr_lower = (stderr or "").lower()
        if "login" in stderr_lower or "redirect" in stderr_lower:
            return {
                "error": (
                    "This appears to be a photo post. Instagram requires login cookies — "
                    "place a cookies.txt file next to the backend folder to enable downloads."
                )
            }
        return None

    # Parse gallery-dl JSON output — each line is [[dir_parts], {metadata}]
    photo_items = []
    for line in stdout.strip().split("\n"):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
        meta = None
        if isinstance(data, list) and len(data) >= 2 and isinstance(data[-1], dict):
            meta = data[-1]
        elif isinstance(data, dict):
            meta = data
        if meta and ("url" in meta or "filename" in meta):
            photo_items.append(meta)

    if not photo_items:
        return None

    first = photo_items[0]
    title = first.get("description", first.get("title", "Photo")) or "Photo"
    if len(title) > 80:
        title = title[:77] + "..."
    thumbnail = first.get("url", "")
    username = first.get("username", first.get("uploader", ""))

    return {
        "type": "photo",
        "title": title,
        "thumbnail": thumbnail,
        "duration": None,
        "uploader": username,
        "extractor": (first.get("category", "") or "Photo").title(),
        "webpage_url": url,
        "photo_count": len(photo_items),
        "available_formats": [],
    }


async def fetch_info(url: str) -> dict:
    cmd = get_ytdlp_cmd() + ["--dump-json", "--age-limit", "99", url]
    if os.path.isfile(COOKIES_PATH):
        cmd += ["--cookies", COOKIES_PATH]

    loop = asyncio.get_running_loop()
    stdout, stderr, returncode = await loop.run_in_executor(None, _run_info_cmd, cmd)

    # Check stderr for "0 items" playlist (e.g. Instagram photo posts)
    is_zero_items = stderr and "Downloading 0 items" in stderr

    # If yt-dlp found no content, try gallery-dl for photo content
    if is_zero_items or (not stdout.strip() and returncode != 0):
        photo_info = await _fetch_photo_info(url)
        if photo_info:
            return photo_info

    if is_zero_items:
        return {"error": "No downloadable content found. If this is a photo post, place a cookies.txt file in the project folder."}

    if stdout:
        # yt-dlp may output multiple JSON lines for playlists — use the first one
        first_line = stdout.strip().split("\n")[0]
        try:
            data = json.loads(first_line)
        except json.JSONDecodeError:
            if returncode != 0:
                error_lines = [l for l in stderr.strip().splitlines() if not l.startswith("WARNING")]
                msg = "\n".join(error_lines).strip() if error_lines else stderr.strip()
                return {"error": msg or "Failed to fetch video info"}
            return {"error": "Failed to parse video info from yt-dlp"}
    else:
        if returncode != 0:
            error_lines = [l for l in stderr.strip().splitlines() if not l.startswith("WARNING")]
            msg = "\n".join(error_lines).strip() if error_lines else stderr.strip()
            return {"error": msg or "Failed to fetch video info"}
        return {"error": "No downloadable content found. This might be a photo-only post or require login."}

    formats = []
    for f in data.get("formats", []):
        ext = f.get("ext", "")
        height = f.get("height")
        note = f.get("format_note", "")
        fid = f.get("format_id", "")
        if ext and fid:
            formats.append({"id": fid, "ext": ext, "height": height, "note": note})

    return {
        "type": "video",
        "title": data.get("title", "Unknown"),
        "thumbnail": data.get("thumbnail", ""),
        "duration": data.get("duration"),
        "uploader": data.get("uploader") or data.get("channel", ""),
        "extractor": data.get("extractor_key") or data.get("extractor", ""),
        "webpage_url": data.get("webpage_url", url),
        "available_formats": formats,
    }


def get_download_dir() -> str:
    return str(pathlib.Path.home() / "Downloads")


def check_file_exists(title: str, ext: str) -> dict:
    """Check if a file with this title+ext already exists in Downloads."""
    output_dir = get_download_dir()
    filename = f"{title}.{ext}"
    filepath = os.path.join(output_dir, filename)
    if os.path.isfile(filepath):
        return {"exists": True, "filename": filename}
    return {"exists": False, "filename": filename}


def _unique_filename(directory: str, name: str, ext: str) -> str:
    """Return a non-colliding filename like 'name (2).ext'."""
    base = os.path.join(directory, f"{name}.{ext}")
    if not os.path.isfile(base):
        return f"{name}.{ext}"
    i = 2
    while os.path.isfile(os.path.join(directory, f"{name} ({i}).{ext}")):
        i += 1
    return f"{name} ({i}).{ext}"


async def stream_download(
    url: str,
    fmt: str = "mp4",
    quality: str = "720p",
    subtitles: bool = False,
    embed_thumbnail: bool = False,
    audio_only: bool = False,
    overwrite: str = "yes",
    custom_filename: str = "",
) -> AsyncGenerator[str, None]:
    output_dir = get_download_dir()
    os.makedirs(output_dir, exist_ok=True)

    if custom_filename:
        # User provided a custom name
        output_template = os.path.join(output_dir, custom_filename)
    elif overwrite == "rename":
        # Auto-rename handled via yt-dlp template; we'll let yt-dlp decide title
        # and fix duplicates after — but simpler to just use yt-dlp's --no-overwrites
        output_template = os.path.join(output_dir, "%(title)s.%(ext)s")
    else:
        output_template = os.path.join(output_dir, "%(title)s.%(ext)s")

    if audio_only:
        fmt = "mp3"

    format_selector = _build_format_selector(fmt, quality)

    merge_ext = "webm" if fmt == "webm" else "mp4"

    cmd = get_ytdlp_cmd() + [
        "--newline",
        "--progress",
        "-f", format_selector,
        "--merge-output-format", merge_ext,
        "-o", output_template,
        "--no-playlist",
        "--age-limit", "99",
    ]

    if overwrite == "yes":
        cmd += ["--force-overwrites"]

    if fmt == "mp3" or audio_only:
        cmd += ["-x", "--audio-format", "mp3"]

    if subtitles:
        cmd += ["--write-sub", "--write-auto-sub", "--embed-subs"]

    if embed_thumbnail:
        cmd += ["--embed-thumbnail"]

    if os.path.isfile(COOKIES_PATH):
        cmd += ["--cookies", COOKIES_PATH]

    cmd.append(url)

    # Use sync subprocess + thread to avoid Windows asyncio subprocess issues
    queue: asyncio.Queue[str | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def _reader():
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        assert proc.stdout is not None
        for raw_line in proc.stdout:
            line = raw_line.decode(errors="replace").rstrip()
            if line:
                loop.call_soon_threadsafe(queue.put_nowait, line.replace("\n", " "))
        proc.wait()
        rc = proc.returncode
        if rc == 0:
            loop.call_soon_threadsafe(queue.put_nowait, "\u2713 Done")
        else:
            loop.call_soon_threadsafe(queue.put_nowait, f"ERROR: Process exited with code {rc}")
        loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    thread = threading.Thread(target=_reader, daemon=True)
    thread.start()

    while True:
        item = await queue.get()
        if item is None:
            break
        yield item
    yield "[DONE]"


async def stream_photo_download(
    url: str,
    overwrite: str = "yes",
) -> AsyncGenerator[str, None]:
    """Download photos using gallery-dl."""
    output_dir = get_download_dir()
    os.makedirs(output_dir, exist_ok=True)

    cmd = get_gallerydl_cmd() + [
        "--dest", output_dir,
        "-o", "directory=[]",
    ]

    if os.path.isfile(COOKIES_PATH):
        cmd += ["--cookies", COOKIES_PATH]

    cmd.append(url)

    queue: asyncio.Queue[str | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def _reader():
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        assert proc.stdout is not None
        for raw_line in proc.stdout:
            line = raw_line.decode(errors="replace").rstrip()
            if line:
                loop.call_soon_threadsafe(queue.put_nowait, line)
        proc.wait()
        rc = proc.returncode
        if rc == 0:
            loop.call_soon_threadsafe(queue.put_nowait, "\u2713 Done")
        else:
            loop.call_soon_threadsafe(queue.put_nowait, f"ERROR: gallery-dl exited with code {rc}")
        loop.call_soon_threadsafe(queue.put_nowait, None)

    thread = threading.Thread(target=_reader, daemon=True)
    thread.start()

    while True:
        item = await queue.get()
        if item is None:
            break
        yield item
    yield "[DONE]"
