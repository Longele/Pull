import os
import io
import uuid
import time
import base64
import shutil
import subprocess
import threading
import zipfile
import re
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
import pikepdf
import img2pdf
from PIL import Image
from reportlab.pdfgen import canvas as rl_canvas

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, field_validator

# ── Config ────────────────────────────────────────────────────────────────────
TEMP_DIR = Path("/tmp/toolbox/folio")
TEMP_DIR.mkdir(parents=True, exist_ok=True)
FILE_TTL_SECONDS = 3600  # 1 hour

_ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5180,http://127.0.0.1:5173,http://127.0.0.1:5180",
).split(",")

app = FastAPI(title="FOLIO", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["X-Original-Size", "X-Compressed-Size", "X-Savings-Pct"],
)

# ── Background purge ──────────────────────────────────────────────────────────
def _purge_old_files():
    while True:
        try:
            now = time.time()
            for p in TEMP_DIR.iterdir():
                if p.is_dir() and (now - p.stat().st_mtime) > FILE_TTL_SECONDS:
                    shutil.rmtree(p, ignore_errors=True)
        except Exception:
            pass
        time.sleep(300)

threading.Thread(target=_purge_old_files, daemon=True).start()

# ── Helpers ───────────────────────────────────────────────────────────────────
def _new_file_dir() -> tuple[str, Path]:
    file_id = str(uuid.uuid4())
    d = TEMP_DIR / file_id
    d.mkdir(parents=True, exist_ok=True)
    return file_id, d


def _file_path(file_id: str) -> Path:
    # Validate file_id to prevent path traversal
    if not re.match(r'^[0-9a-f\-]{36}$', file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID.")
    p = TEMP_DIR / file_id
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found or expired.")
    # Ensure it's actually inside TEMP_DIR
    try:
        p.resolve().relative_to(TEMP_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID.")
    return p


def _pdf_path(file_id: str) -> Path:
    d = _file_path(file_id)
    pdfs = list(d.glob("*.pdf"))
    if not pdfs:
        raise HTTPException(status_code=404, detail="PDF not found. Re-upload the file.")
    return pdfs[0]


def _streaming_response(data: bytes, filename: str, extra_headers: dict = None) -> Response:
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    if extra_headers:
        headers.update(extra_headers)
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers=headers,
    )


@app.get("/folio/health")
async def health():
    return {"status": "ok"}


# ── Upload ─────────────────────────────────────────────────────────────────────
@app.post("/folio/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    data = await file.read()
    if len(data) > 200 * 1024 * 1024:  # 200 MB cap
        raise HTTPException(status_code=413, detail="File too large (max 200 MB).")
    file_id, d = _new_file_dir()
    dest = d / "document.pdf"
    dest.write_bytes(data)
    try:
        doc = fitz.open(str(dest))
        page_count = doc.page_count
        page_dims = [{"width": int(p.rect.width), "height": int(p.rect.height)} for p in doc]
        doc.close()
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read PDF. It may be corrupt or encrypted.")
    return {
        "file_id": file_id,
        "page_count": page_count,
        "page_dims": page_dims,
        "size": len(data),
    }


@app.post("/folio/upload-image")
async def upload_image(file: UploadFile = File(...)):
    name = (file.filename or "").lower()
    if not any(name.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")):
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WebP images accepted.")
    data = await file.read()
    if len(data) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 50 MB).")
    file_id, d = _new_file_dir()
    suffix = Path(file.filename or "img.jpg").suffix.lower() or ".jpg"
    dest = d / f"image{suffix}"
    dest.write_bytes(data)
    return {"file_id": file_id, "size": len(data)}


# ── Thumbnails ─────────────────────────────────────────────────────────────────
@app.get("/folio/thumbnail")
async def thumbnail(
    file_id: str = Query(...),
    page: int = Query(0, ge=0),
):
    pdf_path = _pdf_path(file_id)
    try:
        doc = fitz.open(str(pdf_path))
        if page >= doc.page_count:
            raise HTTPException(status_code=400, detail="Page index out of range.")
        p = doc.load_page(page)
        mat = fitz.Matrix(150 / 72, 150 / 72)  # 150 dpi
        pix = p.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
        png_bytes = pix.tobytes("png")
        doc.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    b64 = base64.b64encode(png_bytes).decode()
    return {"data": f"data:image/png;base64,{b64}"}


# ── Merge ─────────────────────────────────────────────────────────────────────
class MergeRequest(BaseModel):
    file_ids: list[str]

    @field_validator("file_ids")
    @classmethod
    def validate_ids(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 files required.")
        if len(v) > 50:
            raise ValueError("Maximum 50 files.")
        return v


@app.post("/folio/merge")
async def merge(req: MergeRequest):
    writer = fitz.open()
    for fid in req.file_ids:
        pdf_path = _pdf_path(fid)
        src = fitz.open(str(pdf_path))
        writer.insert_pdf(src)
        src.close()
    buf = io.BytesIO()
    writer.save(buf)
    writer.close()
    return _streaming_response(buf.getvalue(), "merged.pdf")


# ── Split ─────────────────────────────────────────────────────────────────────
class SplitRequest(BaseModel):
    file_id: str
    pages: Optional[list[int]] = None
    split_all: bool = False


@app.post("/folio/split")
async def split(req: SplitRequest):
    pdf_path = _pdf_path(req.file_id)
    doc = fitz.open(str(pdf_path))
    page_count = doc.page_count

    if req.split_all:
        page_indices = list(range(page_count))
    elif req.pages:
        page_indices = [p for p in req.pages if 0 <= p < page_count]
    else:
        raise HTTPException(status_code=400, detail="Specify pages or split_all=true.")

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i in page_indices:
            sub = fitz.open()
            sub.insert_pdf(doc, from_page=i, to_page=i)
            page_buf = io.BytesIO()
            sub.save(page_buf)
            sub.close()
            zf.writestr(f"page_{i + 1:04d}.pdf", page_buf.getvalue())
    doc.close()

    return _streaming_response(zip_buf.getvalue(), "pages.zip")


# ── Compress ───────────────────────────────────────────────────────────────────
QUALITY_DPI = {"screen": 72, "ebook": 150, "print": 300}


def _compress_ghostscript(src_path: str, dst_path: str, dpi: int) -> bool:
    gs = shutil.which("gs") or shutil.which("gswin64c") or shutil.which("gswin32c")
    if not gs:
        return False
    settings = {72: "/screen", 150: "/ebook", 300: "/printer"}.get(dpi, "/ebook")
    result = subprocess.run(
        [gs, "-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dQUIET",
         f"-dPDFSETTINGS={settings}", f"-r{dpi}",
         f"-sOutputFile={dst_path}", src_path],
        capture_output=True, timeout=120,
    )
    return result.returncode == 0 and Path(dst_path).exists()


class CompressRequest(BaseModel):
    file_id: str
    quality: str = "ebook"

    @field_validator("quality")
    @classmethod
    def validate_quality(cls, v):
        if v not in QUALITY_DPI:
            raise ValueError("quality must be screen, ebook, or print.")
        return v


@app.post("/folio/compress")
async def compress(req: CompressRequest):
    pdf_path = _pdf_path(req.file_id)
    orig_size = pdf_path.stat().st_size
    dpi = QUALITY_DPI[req.quality]

    # Try Ghostscript first
    _, out_dir = _new_file_dir()
    out_path = str(out_dir / "compressed.pdf")
    success = _compress_ghostscript(str(pdf_path), out_path, dpi)

    if not success:
        # Fallback: pikepdf remove unused objects
        out_path_pk = str(out_dir / "compressed_pk.pdf")
        try:
            with pikepdf.open(str(pdf_path)) as pdf:
                pdf.save(out_path_pk, compress_streams=True, recompress_flate=True)
            out_path = out_path_pk
            success = True
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Compression failed: {e}")

    comp_data = Path(out_path).read_bytes()
    comp_size = len(comp_data)
    savings = round(max(0, (orig_size - comp_size) / orig_size * 100), 1) if orig_size > 0 else 0.0

    headers = {
        "X-Original-Size": str(orig_size),
        "X-Compressed-Size": str(comp_size),
        "X-Savings-Pct": str(savings),
    }
    return _streaming_response(comp_data, "compressed.pdf", headers)


# ── Rotate & Delete ───────────────────────────────────────────────────────────
class RotateRequest(BaseModel):
    file_id: str
    rotations: dict = {}   # { "0": 90, "2": 180 }
    deletions: list[int] = []


@app.post("/folio/rotate")
async def rotate_delete(req: RotateRequest):
    pdf_path = _pdf_path(req.file_id)
    doc = fitz.open(str(pdf_path))
    page_count = doc.page_count

    # Validate deletions
    deletions = set(d for d in req.deletions if 0 <= d < page_count)
    if len(deletions) >= page_count:
        raise HTTPException(status_code=400, detail="Cannot delete all pages.")

    # Apply rotations
    for page_str, deg in req.rotations.items():
        try:
            idx = int(page_str)
        except (ValueError, TypeError):
            continue
        if 0 <= idx < page_count and idx not in deletions:
            page = doc.load_page(idx)
            page.set_rotation((page.rotation + int(deg)) % 360)

    # Build new doc without deleted pages
    out = fitz.open()
    for i in range(page_count):
        if i not in deletions:
            out.insert_pdf(doc, from_page=i, to_page=i)
    doc.close()

    buf = io.BytesIO()
    out.save(buf)
    out.close()
    return _streaming_response(buf.getvalue(), "modified.pdf")


# ── PDF → Images ──────────────────────────────────────────────────────────────
class ToImagesRequest(BaseModel):
    file_id: str
    format: str = "jpg"
    dpi: int = 150

    @field_validator("format")
    @classmethod
    def validate_fmt(cls, v):
        if v not in ("jpg", "png", "webp"):
            raise ValueError("format must be jpg, png, or webp.")
        return v

    @field_validator("dpi")
    @classmethod
    def validate_dpi(cls, v):
        if v not in (72, 150, 300):
            raise ValueError("dpi must be 72, 150, or 300.")
        return v


@app.post("/folio/to-images")
async def to_images(req: ToImagesRequest):
    pdf_path = _pdf_path(req.file_id)
    doc = fitz.open(str(pdf_path))
    zoom = req.dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pil_fmt = {"jpg": "JPEG", "png": "PNG", "webp": "WEBP"}.get(req.format, "JPEG")
    ext = req.format if req.format != "jpg" else "jpg"

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i in range(doc.page_count):
            pix = doc.load_page(i).get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img_buf = io.BytesIO()
            if pil_fmt == "JPEG":
                img.save(img_buf, "JPEG", quality=85, optimize=True)
            else:
                img.save(img_buf, pil_fmt)
            zf.writestr(f"page_{i + 1:04d}.{ext}", img_buf.getvalue())
    doc.close()
    return _streaming_response(zip_buf.getvalue(), f"pages_{req.dpi}dpi.zip")


# ── Images → PDF ──────────────────────────────────────────────────────────────
class FromImagesRequest(BaseModel):
    file_ids: list[str]

    @field_validator("file_ids")
    @classmethod
    def validate_ids(cls, v):
        if not v:
            raise ValueError("At least 1 image required.")
        if len(v) > 500:
            raise ValueError("Maximum 500 images.")
        return v


@app.post("/folio/from-images")
async def from_images(req: FromImagesRequest):
    image_paths = []
    for fid in req.file_ids:
        d = _file_path(fid)
        imgs = [f for f in d.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        if not imgs:
            raise HTTPException(status_code=400, detail=f"No image found for file_id {fid}")
        # Convert webp to png for img2pdf compatibility
        p = imgs[0]
        if p.suffix.lower() == ".webp":
            img = Image.open(str(p)).convert("RGB")
            converted = p.with_suffix(".png")
            img.save(str(converted))
            p = converted
        image_paths.append(str(p))

    try:
        pdf_bytes = img2pdf.convert(image_paths)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {e}")

    return _streaming_response(pdf_bytes, "images_to_pdf.pdf")


# ── Sign ───────────────────────────────────────────────────────────────────────
class SignRequest(BaseModel):
    file_id: str
    sig_data: str   # data:image/png;base64,<data>
    page: int = 0
    x: float = 50.0
    y: float = 700.0
    w: float = 150.0
    h: float = 60.0


@app.post("/folio/sign")
async def sign(req: SignRequest):
    pdf_path = _pdf_path(req.file_id)
    # Decode signature
    if "," not in req.sig_data:
        raise HTTPException(status_code=400, detail="Invalid signature data.")
    b64_part = req.sig_data.split(",", 1)[1]
    try:
        sig_bytes = base64.b64decode(b64_part)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 in signature.")

    sig_img = Image.open(io.BytesIO(sig_bytes)).convert("RGBA")
    doc = fitz.open(str(pdf_path))
    if req.page >= doc.page_count:
        raise HTTPException(status_code=400, detail="Page index out of range.")

    page = doc.load_page(req.page)
    page_h = page.rect.height

    # Save sig as PNG for fitz
    sig_buf = io.BytesIO()
    sig_img.save(sig_buf, "PNG")
    sig_buf.seek(0)

    # Insert image — convert coords (origin top-left) to PDF (origin bottom-left)
    x0, y0, w, h = float(req.x), float(req.y), float(req.w), float(req.h)
    # Clamp dimensions
    w = min(w, 600)
    h = min(h, 300)
    rect = fitz.Rect(x0, page_h - y0 - h, x0 + w, page_h - y0)
    page.insert_image(rect, stream=sig_buf.getvalue(), keep_proportion=True)

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return _streaming_response(buf.getvalue(), "signed.pdf")


# ── Watermark ──────────────────────────────────────────────────────────────────
class WatermarkRequest(BaseModel):
    file_id: str
    text: str
    opacity: float = 0.15
    font_size: int = 48
    angle: int = 45
    position: str = "diagonal"
    color: str = "#F0EBE1"

    @field_validator("text")
    @classmethod
    def validate_text(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Watermark text cannot be empty.")
        if len(v) > 100:
            raise ValueError("Watermark text too long.")
        return v

    @field_validator("opacity")
    @classmethod
    def validate_opacity(cls, v):
        return max(0.0, min(1.0, v))

    @field_validator("position")
    @classmethod
    def validate_position(cls, v):
        if v not in ("diagonal", "header", "footer"):
            raise ValueError("position must be diagonal, header, or footer.")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        # Reject anything that doesn't look like a CSS hex or rgba
        if not re.match(r'^(#[0-9a-fA-F]{3,8}|rgba?\([^)]{0,50}\))$', v):
            return "#F0EBE1"
        return v


def _hex_to_rgb01(hex_color: str) -> tuple:
    h = hex_color.strip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) < 6:
        return (0.94, 0.92, 0.88)
    r = int(h[0:2], 16) / 255
    g = int(h[2:4], 16) / 255
    b = int(h[4:6], 16) / 255
    return (r, g, b)


@app.post("/folio/watermark")
async def watermark(req: WatermarkRequest):
    import math
    pdf_path = _pdf_path(req.file_id)
    doc = fitz.open(str(pdf_path))

    color_rgb = _hex_to_rgb01(req.color) if req.color.startswith("#") else (0.94, 0.92, 0.88)

    for page in doc:
        w = page.rect.width
        h = page.rect.height

        if req.position == "diagonal":
            x = w / 2
            y = h / 2
        elif req.position == "header":
            x = w / 2
            y = 40
        else:  # footer
            x = w / 2
            y = h - 40

        page.insert_text(
            (x - req.font_size * len(req.text) * 0.3, y),
            req.text,
            fontsize=float(req.font_size),
            rotate=req.angle,
            color=color_rgb,
            fill_opacity=req.opacity,
            overlay=True,
        )

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return _streaming_response(buf.getvalue(), "watermarked.pdf")


# ── Unlock ─────────────────────────────────────────────────────────────────────
class UnlockRequest(BaseModel):
    file_id: str
    password: str = ""


@app.post("/folio/unlock")
async def unlock(req: UnlockRequest):
    pdf_path = _pdf_path(req.file_id)
    try:
        with pikepdf.open(str(pdf_path), password=req.password) as pdf:
            buf = io.BytesIO()
            pdf.save(buf)
            return _streaming_response(buf.getvalue(), "unlocked.pdf")
    except pikepdf.PasswordError:
        raise HTTPException(status_code=400, detail="Wrong password. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not unlock PDF: {e}")
