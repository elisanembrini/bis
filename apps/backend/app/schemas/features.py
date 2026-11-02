from pydantic import BaseModel


class FeaturesResponse(BaseModel):
    recipe_import: bool
