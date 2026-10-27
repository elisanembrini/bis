import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status

from app.core.security import Authenticated, get_authenticated
from app.schemas.errors import ErrorResponse
from app.schemas.recipe import SEARCH_MAX_LENGTH, RecipeInput, RecipeResponse, RecipeSummary
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


@router.get(
    "", response_model=list[RecipeSummary], responses=UNAUTHENTICATED, operation_id="listRecipes"
)
def list_recipes(
    current: CurrentUser,
    service: Service,
    q: Annotated[str | None, Query(max_length=SEARCH_MAX_LENGTH)] = None,
    ingredient: Annotated[str | None, Query(max_length=SEARCH_MAX_LENGTH)] = None,
    tag_id: uuid.UUID | None = None,
) -> list[RecipeSummary]:
    return service.search(current.user, title=q, ingredient=ingredient, tag_id=tag_id)


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
    return service.get_own(current.user, recipe_id)


@router.put(
    "/{recipe_id}", response_model=RecipeResponse, responses=NOT_FOUND, operation_id="updateRecipe"
)
def update_recipe(
    recipe_id: uuid.UUID, body: RecipeInput, current: CurrentUser, service: Service
) -> RecipeResponse:
    return service.update(current.user, recipe_id, body)


@router.delete(
    "/{recipe_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=NOT_FOUND,
    operation_id="deleteRecipe",
)
def delete_recipe(recipe_id: uuid.UUID, current: CurrentUser, service: Service) -> None:
    service.delete(current.user, recipe_id)
