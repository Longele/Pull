import os
import urllib.request

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sse_starlette.sse import EventSourceResponse

from database import init_db, save_download, get_history
from downloader import fetch_info, stream_download, stream_photo_download, check_file_exists, validate_url, sanitize_filename

app = FastAPI(title="PULL", version="1.0.0")

_ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5180,http://127.0.0.1:5173,http://127.0.0.1:5180",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/info")
async def info(url: str = Query(..., description="Video URL")):
    url_error = validate_url(url)
    if url_error:
        return {"error": url_error}
    try:
        return await fetch_info(url)
    except Exception as e:
        return {"error": str(e)}


@app.get("/check-file")
async def check_file(title: str = Query(...), ext: str = Query("mp4")):
    return check_file_exists(title, ext)


@app.get("/proxy-thumb")
async def proxy_thumb(url: str = Query(..., description="Thumbnail URL")):
    """Proxy external thumbnails to bypass hotlink protection."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return Response(status_code=400)
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": f"{parsed.scheme}://{parsed.netloc}/",
        })
        resp = urllib.request.urlopen(req, timeout=10)
        data = resp.read()
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        return Response(content=data, media_type=content_type, headers={
            "Cache-Control": "public, max-age=3600",
        })
    except Exception:
        return Response(status_code=502)


@app.get("/download/stream")
async def download_stream(
    url: str = Query(...),
    format: str = Query("mp4"),
    quality: str = Query("720p"),
    subtitles: bool = Query(False),
    embed_thumbnail: bool = Query(False),
    audio_only: bool = Query(False),
    overwrite: str = Query("yes"),
    custom_filename: str = Query(""),
    content_type: str = Query("video"),
):
    url_error = validate_url(url)
    if url_error:
        async def error_gen():
            yield url_error
            yield "[ERROR]"
        return EventSourceResponse(error_gen())

    if custom_filename:
        custom_filename = sanitize_filename(custom_filename)

    async def generator():
        title = ""
        thumbnail = ""
        platform = ""
        size_line = ""

        # Try to get metadata before streaming
        try:
            meta = await fetch_info(url)
            title = meta.get("title", "")
            thumbnail = meta.get("thumbnail", "")
            platform = meta.get("extractor", "")
        except Exception:
            pass

        if content_type == "photo":
            async for chunk in stream_photo_download(
                url=url,
                overwrite=overwrite,
            ):
                yield chunk
        else:
            async for chunk in stream_download(
                url=url,
                fmt=format,
                quality=quality,
                subtitles=subtitles,
                embed_thumbnail=embed_thumbnail,
                audio_only=audio_only,
                overwrite=overwrite,
                custom_filename=custom_filename,
            ):
                # Try to extract file size from yt-dlp output lines
                line_text = chunk.replace("data: ", "").strip()
                if "MiB" in line_text or "KiB" in line_text:
                    size_line = line_text

                yield chunk

        # Save to history on completion
        if title:
            try:
                await save_download(
                    title=title,
                    url=url,
                    thumbnail=thumbnail,
                    platform=platform,
                    fmt="photo" if content_type == "photo" else format,
                    size=size_line[:60] if size_line else "",
                )
            except Exception:
                pass

    return EventSourceResponse(generator())


@app.get("/history")
async def history(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0)):
    return await get_history(limit, offset)
