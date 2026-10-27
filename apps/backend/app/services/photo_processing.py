import io
import warnings
from dataclasses import dataclass

from PIL import Image, ImageCms, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener

register_heif_opener()

ALLOWED_FORMATS = ("JPEG", "PNG", "WEBP", "HEIF")
MAX_PIXELS = 50_000_000
FULL_SIZE = 1600
THUMBNAIL_SIZE = 480
FULL_QUALITY = 82
THUMBNAIL_QUALITY = 75

Image.MAX_IMAGE_PIXELS = MAX_PIXELS


class InvalidImageError(Exception):
    pass


@dataclass(frozen=True)
class ProcessedPhoto:
    full: bytes
    thumbnail: bytes
    width: int
    height: int


def process_photo(data: bytes) -> ProcessedPhoto:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data), formats=ALLOWED_FORMATS) as source:
                source.load()
                upright = ImageOps.exif_transpose(source)
                pixels = _to_srgb(upright, source.info.get("icc_profile"))
    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        OSError,
        ValueError,
        SyntaxError,
        EOFError,
    ) as exc:
        raise InvalidImageError from exc

    clean = Image.frombytes(pixels.mode, pixels.size, pixels.tobytes())
    clean.thumbnail((FULL_SIZE, FULL_SIZE), Image.Resampling.LANCZOS)
    thumbnail = clean.copy()
    thumbnail.thumbnail((THUMBNAIL_SIZE, THUMBNAIL_SIZE), Image.Resampling.LANCZOS)
    return ProcessedPhoto(
        full=_encode(clean, FULL_QUALITY),
        thumbnail=_encode(thumbnail, THUMBNAIL_QUALITY),
        width=clean.width,
        height=clean.height,
    )


def _has_alpha(image: Image.Image) -> bool:
    return image.mode in ("RGBA", "LA", "PA") or (
        image.mode == "P" and "transparency" in image.info
    )


def _to_srgb(image: Image.Image, icc_profile: object) -> Image.Image:
    output_mode = "RGBA" if _has_alpha(image) else "RGB"
    if isinstance(icc_profile, bytes) and icc_profile:
        try:
            source_profile = ImageCms.ImageCmsProfile(io.BytesIO(icc_profile))
            srgb = ImageCms.createProfile("sRGB")
            converted = ImageCms.profileToProfile(
                image.convert(output_mode) if image.mode not in ("RGB", "RGBA", "CMYK") else image,
                source_profile,
                srgb,
                outputMode=output_mode,
            )
            if converted is not None:
                return converted
        except (ImageCms.PyCMSError, OSError, ValueError):
            pass
    return image.convert(output_mode)


def _encode(image: Image.Image, quality: int) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=quality, method=4)
    return buffer.getvalue()
