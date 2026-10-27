import io
from datetime import timedelta
from pathlib import Path
from typing import Any

import httpx2
from fastapi.testclient import TestClient
from PIL import ExifTags, Image
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Photo
from app.services.photo_service import delete_unlinked_photos
from app.services.photo_storage import PhotoStorage
from tests.conftest import FakeClock
from tests.images import encoded, jpeg_with_gps_and_rotation, png_with_transparency, small_jpeg
from tests.test_household import Headers, register
from tests.test_recipes import recipe_payload

OCTET_STREAM = {"Content-Type": "application/octet-stream"}


def upload(client: TestClient, user: Headers, data: bytes, **headers: str) -> httpx2.Response:
    return client.post("/photos", content=data, headers={**user, **OCTET_STREAM, **headers})


def upload_id(client: TestClient, user: Headers, data: bytes | None = None) -> str:
    response = upload(client, user, small_jpeg() if data is None else data)
    assert response.status_code == 201, response.text
    photo_id: str = response.json()["id"]
    return photo_id


def stored_files(photos_dir: Path) -> list[Path]:
    return sorted(path for path in photos_dir.rglob("*") if path.is_file())


def download(client: TestClient, user: Headers, photo_id: str, size: str = "full") -> Image.Image:
    response = client.get(f"/photos/{photo_id}", params={"size": size}, headers=user)
    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "image/webp"
    return Image.open(io.BytesIO(response.content))


def recipe_with_photos(
    client: TestClient, user: Headers, cover: str | None, step: str | None
) -> dict[str, Any]:
    payload = recipe_payload(cover_photo_id=cover)
    payload["steps"][0]["photo_id"] = step
    response = client.post("/recipes", json=payload, headers=user)
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def test_upload_rotates_strips_metadata_and_resizes(client: TestClient) -> None:
    anna = register(client, "Anna")
    original = jpeg_with_gps_and_rotation()
    assert Image.open(io.BytesIO(original)).getexif().get_ifd(ExifTags.IFD.GPSInfo)

    response = upload(client, anna, original)

    assert response.status_code == 201
    body = response.json()
    assert (body["width"], body["height"]) == (1067, 1600)
    full = download(client, anna, body["id"])
    assert full.format == "WEBP"
    assert full.size == (1067, 1600)
    assert len(full.getexif()) == 0
    assert not full.getexif().get_ifd(ExifTags.IFD.GPSInfo)
    assert "exif" not in full.info
    assert "xmp" not in full.info
    assert "icc_profile" not in full.info
    top_pixel = full.convert("RGB").getpixel((full.width // 2, 50))
    bottom_pixel = full.convert("RGB").getpixel((full.width // 2, full.height - 50))
    assert isinstance(top_pixel, tuple)
    assert isinstance(bottom_pixel, tuple)
    assert top_pixel[0] > 200 > top_pixel[2]
    assert bottom_pixel[2] > 200 > bottom_pixel[0]
    thumbnail = download(client, anna, body["id"], size="thumb")
    assert max(thumbnail.size) == 480
    assert len(thumbnail.getexif()) == 0


def test_small_images_are_not_enlarged(client: TestClient) -> None:
    anna = register(client, "Anna")

    response = upload(client, anna, small_jpeg())

    assert (response.json()["width"], response.json()["height"]) == (640, 480)


def test_png_with_transparency_webp_and_heic_are_accepted(client: TestClient) -> None:
    anna = register(client, "Anna")

    png = upload(client, anna, png_with_transparency())
    webp = upload(client, anna, encoded("WEBP"))
    heic = upload(client, anna, encoded("HEIF"))

    assert [png.status_code, webp.status_code, heic.status_code] == [201, 201, 201]
    transparent = download(client, anna, png.json()["id"])
    assert transparent.mode == "RGBA"
    assert transparent.getpixel((10, 10)) == (0, 0, 0, 0)


def test_files_get_random_names_never_the_original_one(
    client: TestClient, photos_dir: Path, db_session: Session
) -> None:
    anna = register(client, "Anna")

    upload(client, anna, small_jpeg(), **{"Content-Disposition": 'attachment; filename="casa.jpg"'})

    photo = db_session.scalars(select(Photo)).one()
    names = [path.name for path in stored_files(photos_dir)]
    assert names == [f"{photo.storage_key}.thumb.webp", f"{photo.storage_key}.webp"]
    assert all("casa" not in name for name in names)
    assert len(photo.storage_key) == 32


def test_too_large_file_is_rejected_without_writing_files(
    client: TestClient, photos_dir: Path
) -> None:
    anna = register(client, "Anna")

    response = upload(client, anna, b"\xff" * (10 * 1024 * 1024 + 1))

    assert response.status_code == 413
    assert response.json()["code"] == "PHOTO_TOO_LARGE"
    assert stored_files(photos_dir) == []


def test_file_that_is_not_an_image_is_rejected(client: TestClient, photos_dir: Path) -> None:
    anna = register(client, "Anna")

    response = upload(
        client,
        anna,
        b"Questa non e' una foto, solo testo con un nome che finisce in .jpg",
        **{"Content-Type": "image/jpeg"},
    )

    assert response.status_code == 422
    assert response.json()["code"] == "PHOTO_INVALID"
    assert stored_files(photos_dir) == []


def test_truncated_image_is_rejected(client: TestClient) -> None:
    anna = register(client, "Anna")

    response = upload(client, anna, small_jpeg()[:500])

    assert response.status_code == 422


def test_unsupported_image_format_is_rejected(client: TestClient) -> None:
    anna = register(client, "Anna")

    response = upload(client, anna, encoded("GIF"))

    assert response.status_code == 422
    assert response.json()["code"] == "PHOTO_INVALID"


def test_upload_requires_login(client: TestClient) -> None:
    assert client.post("/photos", content=small_jpeg(), headers=OCTET_STREAM).status_code == 401


def test_other_users_cannot_download_a_photo(client: TestClient) -> None:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    photo_id = upload_id(client, anna)
    recipe_with_photos(client, anna, cover=photo_id, step=None)

    full = client.get(f"/photos/{photo_id}", headers=bruno)
    thumb = client.get(f"/photos/{photo_id}", params={"size": "thumb"}, headers=bruno)

    assert full.status_code == 404
    assert full.json()["code"] == "PHOTO_NOT_FOUND"
    assert thumb.status_code == 404
    assert client.get(f"/photos/{photo_id}").status_code == 401


def test_photo_response_is_cached_privately(client: TestClient) -> None:
    anna = register(client, "Anna")
    photo_id = upload_id(client, anna)

    response = client.get(f"/photos/{photo_id}", headers=anna)

    assert response.headers["cache-control"] == "private, max-age=31536000, immutable"
    assert response.headers["x-content-type-options"] == "nosniff"


def test_recipe_links_cover_and_step_photos(client: TestClient) -> None:
    anna = register(client, "Anna")
    cover = upload_id(client, anna)
    step = upload_id(client, anna)

    recipe = recipe_with_photos(client, anna, cover=cover, step=step)

    assert recipe["cover_photo_id"] == cover
    assert recipe["steps"][0]["photo_id"] == step
    assert client.get("/recipes", headers=anna).json()[0]["cover_photo_id"] == cover


def test_cannot_use_a_photo_of_another_user(client: TestClient) -> None:
    anna = register(client, "Anna")
    bruno = register(client, "Bruno")
    photo_id = upload_id(client, anna)

    response = client.post("/recipes", json=recipe_payload(cover_photo_id=photo_id), headers=bruno)

    assert response.status_code == 422
    assert response.json()["code"] == "PHOTO_NOT_AVAILABLE"


def test_a_photo_cannot_be_used_twice(client: TestClient) -> None:
    anna = register(client, "Anna")
    photo_id = upload_id(client, anna)
    recipe_with_photos(client, anna, cover=photo_id, step=None)

    in_other_recipe = client.post(
        "/recipes", json=recipe_payload(cover_photo_id=photo_id), headers=anna
    )
    payload = recipe_payload(cover_photo_id=photo_id)
    payload["steps"][0]["photo_id"] = photo_id
    twice_in_same = client.post("/recipes", json=payload, headers=anna)

    assert in_other_recipe.status_code == 422
    assert twice_in_same.status_code == 422


def test_deleting_a_recipe_deletes_its_photos_and_files(
    client: TestClient, photos_dir: Path, db_session: Session
) -> None:
    anna = register(client, "Anna")
    recipe = recipe_with_photos(
        client, anna, cover=upload_id(client, anna), step=upload_id(client, anna)
    )
    assert len(stored_files(photos_dir)) == 4

    response = client.delete(f"/recipes/{recipe['id']}", headers=anna)

    assert response.status_code == 204
    assert stored_files(photos_dir) == []
    assert db_session.scalars(select(Photo)).all() == []


def test_replacing_or_removing_a_photo_deletes_the_old_file(
    client: TestClient, photos_dir: Path
) -> None:
    anna = register(client, "Anna")
    old_cover = upload_id(client, anna)
    step_photo = upload_id(client, anna)
    recipe = recipe_with_photos(client, anna, cover=old_cover, step=step_photo)
    new_cover = upload_id(client, anna)

    response = client.put(
        f"/recipes/{recipe['id']}", json=recipe_payload(cover_photo_id=new_cover), headers=anna
    )

    assert response.status_code == 200
    assert client.get(f"/photos/{old_cover}", headers=anna).status_code == 404
    assert client.get(f"/photos/{step_photo}", headers=anna).status_code == 404
    assert client.get(f"/photos/{new_cover}", headers=anna).status_code == 200
    assert len(stored_files(photos_dir)) == 2


def test_moving_a_photo_within_the_recipe_keeps_it(client: TestClient) -> None:
    anna = register(client, "Anna")
    photo_id = upload_id(client, anna)
    recipe = recipe_with_photos(client, anna, cover=photo_id, step=None)
    payload = recipe_payload(cover_photo_id=None)
    payload["steps"][1]["photo_id"] = photo_id

    response = client.put(f"/recipes/{recipe['id']}", json=payload, headers=anna)

    assert response.status_code == 200
    assert response.json()["steps"][1]["photo_id"] == photo_id
    assert client.get(f"/photos/{photo_id}", headers=anna).status_code == 200


def test_cleanup_removes_only_old_unlinked_photos(
    client: TestClient, clock: FakeClock, db_session: Session, photos_dir: Path
) -> None:
    anna = register(client, "Anna")
    abandoned = upload_id(client, anna)
    linked = upload_id(client, anna)
    recipe_with_photos(client, anna, cover=linked, step=None)
    clock.advance(timedelta(hours=24, minutes=1))
    recent = upload_id(client, anna)

    deleted = delete_unlinked_photos(
        db_session, PhotoStorage(photos_dir), clock.now() - timedelta(hours=24)
    )

    assert deleted == 1
    assert client.get(f"/photos/{abandoned}", headers=anna).status_code == 404
    assert client.get(f"/photos/{linked}", headers=anna).status_code == 200
    assert client.get(f"/photos/{recent}", headers=anna).status_code == 200
    assert len(stored_files(photos_dir)) == 4
