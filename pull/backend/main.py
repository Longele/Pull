from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from database import init_db, save_download, get_history
from downloader import fetch_info, stream_download, stream_photo_download, check_file_exists

app = FastAPI(title="PULL", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/info")
async def info(url: str = Query(..., description="Video URL")):
    try:
        return await fetch_info(url)
    except Exception as e:
        return {"error": str(e)}


@app.get("/check-file")
async def check_file(title: str = Query(...), ext: str = Query("mp4")):
    return check_file_exists(title, ext)


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
    # Fetch metadata for history (fire and forget style — best effort)
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
async def history():
    return await get_history(10)
