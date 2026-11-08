from typing import Annotated, Any

from fastapi import APIRouter, Depends, status

from app.core.security import Authenticated, get_authenticated
from app.schemas.errors import ErrorResponse
from app.schemas.features import FeaturesResponse
from app.services.llm_client import LlmClient, get_llm_client

router = APIRouter(prefix="/features", tags=["features"])

CurrentUser = Annotated[Authenticated, Depends(get_authenticated)]

Responses = dict[int | str, dict[str, Any]]

UNAUTHENTICATED: Responses = {status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}}


@router.get(
    "", response_model=FeaturesResponse, responses=UNAUTHENTICATED, operation_id="getFeatures"
)
def get_features(
    _: CurrentUser, llm: Annotated[LlmClient | None, Depends(get_llm_client)]
) -> FeaturesResponse:
    return FeaturesResponse(recipe_import=llm is not None)
