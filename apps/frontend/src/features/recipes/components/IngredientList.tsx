import { useTranslation } from "react-i18next";

import { useFormatAmount } from "../hooks/useFormatIngredient";
import { scaleQuantity } from "../servings";
import type { IngredientResponse } from "../types";

import classes from "./IngredientList.module.css";

type IngredientListProps = {
  ingredients: IngredientResponse[];
  originalServings: number;
  servings: number;
};

export function IngredientList({ ingredients, originalServings, servings }: IngredientListProps) {
  const { t } = useTranslation("recipes");
  const formatAmount = useFormatAmount();

  return (
    <ul className={classes.list} aria-label={t("detail.ingredients")}>
      {ingredients.map((ingredient) => (
        <li key={ingredient.id} className={classes.ingredient}>
          <span>{ingredient.name}</span>{" "}
          <span className={classes.amount}>
            {formatAmount({
              quantity: scaleQuantity(
                ingredient.quantity,
                ingredient.unit,
                originalServings,
                servings,
              ),
              unit: ingredient.unit,
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
