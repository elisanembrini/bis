from fastapi import FastAPI

from app.core.errors import register_exception_handlers
from app.routers import auth, google_auth, health, household, me, recipes


def create_app() -> FastAPI:
    application = FastAPI(title="Bis", version="0.1.0")
    register_exception_handlers(application)
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(google_auth.router)
    application.include_router(me.router)
    application.include_router(household.router)
    application.include_router(recipes.router)
    return application


app = create_app()
