import io

import pillow_heif
from PIL import ExifTags, Image

pillow_heif.register_heif_opener()


def two_tone(size: tuple[int, int], mode: str = "RGB") -> Image.Image:
    width, height = size
    image = Image.new(mode, size, "red")
    image.paste("blue", (width // 2, 0, width, height))
    return image


def jpeg_with_gps_and_rotation(size: tuple[int, int] = (3000, 2000)) -> bytes:
    exif = Image.Exif()
    exif[ExifTags.Base.Orientation] = 6
    exif[ExifTags.Base.Make] = "TestPhone"
    gps = exif.get_ifd(ExifTags.IFD.GPSInfo)
    gps[ExifTags.GPS.GPSLatitudeRef] = "N"
    gps[ExifTags.GPS.GPSLatitude] = (45.0, 27.0, 50.0)
    gps[ExifTags.GPS.GPSLongitudeRef] = "E"
    gps[ExifTags.GPS.GPSLongitude] = (9.0, 11.0, 24.0)
    buffer = io.BytesIO()
    two_tone(size).save(buffer, "JPEG", exif=exif.tobytes(), quality=90)
    return buffer.getvalue()


def encoded(image_format: str, size: tuple[int, int] = (800, 600), mode: str = "RGB") -> bytes:
    buffer = io.BytesIO()
    two_tone(size, mode).save(buffer, image_format)
    return buffer.getvalue()


def png_with_transparency(size: tuple[int, int] = (800, 600)) -> bytes:
    image = two_tone(size, "RGBA")
    image.paste((0, 0, 0, 0), (0, 0, size[0], size[1] // 2))
    buffer = io.BytesIO()
    image.save(buffer, "PNG")
    return buffer.getvalue()


def small_jpeg() -> bytes:
    return encoded("JPEG", (640, 480))
