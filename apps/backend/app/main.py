from fastapi import FastAPI

from app.core.errors import register_exception_handlers
from app.routers import auth, google_auth, health, household, me, photos, recipes, tags


def create_app() -> FastAPI:
    application = FastAPI(title="Bis", version="0.1.0")
    register_exception_handlers(application)
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(google_auth.router)
    application.include_router(me.router)
    application.include_router(household.router)
    application.include_router(recipes.router)
    application.include_router(photos.router)
    application.include_router(tags.router)
    return application


app = create_app()
