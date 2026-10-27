import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status

from app.core.security import Authenticated, get_authenticated
from app.schemas.errors import ErrorResponse
from app.schemas.recipe import (
    SEARCH_MAX_LENGTH,
    RecipeInput,
    RecipeResponse,
    RecipeScope,
    RecipeSummary,
    ShareCandidate,
    SharesInput,
)
from app.services.recipe_service import RecipeService, get_recipe_service

router = APIRouter(prefix="/recipes", tags=["recipes"])

Service = Annotated[RecipeService, Depends(get_recipe_service)]
CurrentUser = Annotated[Authenticated, Depends(get_authenticated)]

Responses = dict[int | str, dict[str, Any]]

UNAUTHENTICATED: Responses = {status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}}
NOT_FOUND: Responses = {
    **UNAUTHENTICATED,
    status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
}
AUTHOR_ONLY: Responses = {
    **NOT_FOUND,
    status.HTTP_403_FORBIDDEN: {"model": ErrorResponse},
}


@router.get(
    "", response_model=list[RecipeSummary], responses=UNAUTHENTICATED, operation_id="listRecipes"
)
def list_recipes(
    current: CurrentUser,
    service: Service,
    q: Annotated[str | None, Query(max_length=SEARCH_MAX_LENGTH)] = None,
    ingredient: Annotated[str | None, Query(max_length=SEARCH_MAX_LENGTH)] = None,
    tag_id: uuid.UUID | None = None,
    scope: RecipeScope | None = None,
) -> list[RecipeSummary]:
    return service.search(current.user, title=q, ingredient=ingredient, tag_id=tag_id, scope=scope)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=RecipeResponse,
    responses=UNAUTHENTICATED,
    operation_id="createRecipe",
)
def create_recipe(body: RecipeInput, current: CurrentUser, service: Service) -> RecipeResponse:
    return service.create(current.user, body)


@router.get(
    "/{recipe_id}", response_model=RecipeResponse, responses=NOT_FOUND, operation_id="getRecipe"
)
def get_recipe(recipe_id: uuid.UUID, current: CurrentUser, service: Service) -> RecipeResponse:
    return service.get(current.user, recipe_id)


@router.put(
    "/{recipe_id}",
    response_model=RecipeResponse,
    responses=AUTHOR_ONLY,
    operation_id="updateRecipe",
)
def update_recipe(
    recipe_id: uuid.UUID, body: RecipeInput, current: CurrentUser, service: Service
) -> RecipeResponse:
    return service.update(current.user, recipe_id, body)


@router.delete(
    "/{recipe_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=AUTHOR_ONLY,
    operation_id="deleteRecipe",
)
def delete_recipe(recipe_id: uuid.UUID, current: CurrentUser, service: Service) -> None:
    service.delete(current.user, recipe_id)


@router.get(
    "/{recipe_id}/shares",
    response_model=list[ShareCandidate],
    responses=AUTHOR_ONLY,
    operation_id="listRecipeShares",
)
def list_shares(
    recipe_id: uuid.UUID, current: CurrentUser, service: Service
) -> list[ShareCandidate]:
    return service.share_candidates(current.user, recipe_id)


@router.put(
    "/{recipe_id}/shares",
    response_model=list[ShareCandidate],
    responses={**AUTHOR_ONLY, status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": ErrorResponse}},
    operation_id="setRecipeShares",
)
def set_shares(
    recipe_id: uuid.UUID, body: SharesInput, current: CurrentUser, service: Service
) -> list[ShareCandidate]:
    return service.set_shares(current.user, recipe_id, body.user_ids)


@router.post(
    "/{recipe_id}/copy",
    status_code=status.HTTP_201_CREATED,
    response_model=RecipeResponse,
    responses={**NOT_FOUND, status.HTTP_409_CONFLICT: {"model": ErrorResponse}},
    operation_id="copyRecipe",
)
def copy_recipe(recipe_id: uuid.UUID, current: CurrentUser, service: Service) -> RecipeResponse:
    return service.copy(current.user, recipe_id)
