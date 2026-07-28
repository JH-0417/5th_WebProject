"""
Cloudinary 이미지 저장 모듈.

갤러리 사진 파일을 Cloudinary에 업로드하고 URL을 반환합니다.
환경 변수(.env)에 Cloudinary 자격 증명이 설정되어 있어야 합니다.
"""

import os
from typing import Optional

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

GALLERY_FOLDER = "5th_webproject/gallery"
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


def _configure_cloudinary() -> None:
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Cloudinary 설정이 없습니다. .env 파일에 "
                "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET을 설정하세요."
            ),
        )
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )


def validate_gallery_image(content_type: Optional[str], size: int) -> None:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="jpg, png, webp, gif 이미지만 업로드할 수 있습니다.",
        )
    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 크기는 5MB 이하여야 합니다.",
        )


def upload_gallery_image(file_bytes: bytes) -> str:
    """이미지 바이트를 Cloudinary에 업로드하고 secure_url을 반환합니다."""
    _configure_cloudinary()
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=GALLERY_FOLDER,
            resource_type="image",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cloudinary 업로드에 실패했습니다: {exc}",
        ) from exc
    return result["secure_url"]


def delete_gallery_image(image_url: str) -> None:
    """Cloudinary에 저장된 이미지를 삭제합니다. 실패해도 DB 삭제는 계속 진행합니다."""
    if not image_url or "cloudinary.com" not in image_url:
        return

    _configure_cloudinary()
    public_id = cloudinary.utils.public_id_from_url(image_url)
    if not public_id:
        return

    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception:
        return
