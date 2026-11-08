from typing import Annotated, Any

from fastapi import APIRouter, Depends, status

from app.core.security import Authenticated, get_authenticated
from app.schemas.errors import ErrorResponse
from app.schemas.recipe_import import RecipeDraft, RecipeImportInput
from app.services.recipe_import_service import RecipeImportService, get_recipe_import_service

router = APIRouter(prefix="/recipes", tags=["recipes"])

Service = Annotated[RecipeImportService, Depends(get_recipe_import_service)]
CurrentUser = Annotated[Authenticated, Depends(get_authenticated)]

Responses = dict[int | str, dict[str, Any]]

IMPORT_RESPONSES: Responses = {
    status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
    status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": ErrorResponse},
    status.HTTP_429_TOO_MANY_REQUESTS: {"model": ErrorResponse},
    status.HTTP_502_BAD_GATEWAY: {"model": ErrorResponse},
    status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ErrorResponse},
}


@router.post(
    "/import",
    response_model=RecipeDraft,
    responses=IMPORT_RESPONSES,
    operation_id="importRecipe",
)
def import_recipe(body: RecipeImportInput, current: CurrentUser, service: Service) -> RecipeDraft:
    return service.import_recipe(current.user, body)
