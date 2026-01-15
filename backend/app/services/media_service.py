from __future__ import annotations

import base64
import mimetypes
from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile

# When running in Docker, code lives at /app/app/... so parents[2] == /app.
# When running locally from repo, code lives at <repo>/backend/app/... so parents[2] == <repo>/backend.
_BASE_DIR = Path(__file__).resolve().parents[2]
_MEDIA_DIRNAME = "media"


def media_root() -> Path:
    root = _BASE_DIR / _MEDIA_DIRNAME
    root.mkdir(parents=True, exist_ok=True)
    return root


def _safe_suffix(upload: UploadFile) -> str:
    # Prefer filename suffix
    name = (upload.filename or "").strip()
    if "." in name:
        suf = "." + name.split(".")[-1].lower()
        if len(suf) <= 10:
            return suf
    # Fallback to content-type
    if upload.content_type:
        ext = mimetypes.guess_extension(upload.content_type.split(";")[0].strip())
        if ext:
            return ext
    return ""


def save_upload(upload: UploadFile, *, kiosk_id: str, kind: str) -> str:
    """Save upload to media/<kiosk_id>/<kind>/<uuid>.<ext>, return file ref like 'media/...'."""
    root = media_root() / kiosk_id / kind
    root.mkdir(parents=True, exist_ok=True)

    suffix = _safe_suffix(upload)
    filename = f"{uuid4().hex}{suffix}"
    path = root / filename

    # UploadFile.file is a SpooledTemporaryFile
    upload.file.seek(0)
    path.write_bytes(upload.file.read())

    # return relative ref for DB / API
    rel = path.relative_to(_BASE_DIR).as_posix()
    return rel


def file_ref_to_path(ref: str | None) -> Path | None:
    if not ref:
        return None
    if ref.startswith("http://") or ref.startswith("https://") or ref.startswith("data:"):
        return None
    p = (_BASE_DIR / ref).resolve()
    try:
        # Ensure it stays under base dir
        p.relative_to(_BASE_DIR.resolve())
    except Exception:
        return None
    if not p.exists() or not p.is_file():
        return None
    return p


def file_ref_to_data_url(ref: str | None, *, max_bytes: int = 2_500_000) -> str | None:
    """Convert a saved media ref to a data URL for direct <img src=...> rendering."""
    if not ref:
        return None
    if ref.startswith("data:"):
        return ref
    p = file_ref_to_path(ref)
    if not p:
        return None
    data = p.read_bytes()
    if max_bytes and len(data) > max_bytes:
        return None
    mime, _ = mimetypes.guess_type(p.name)
    if not mime:
        mime = "application/octet-stream"
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{b64}"
