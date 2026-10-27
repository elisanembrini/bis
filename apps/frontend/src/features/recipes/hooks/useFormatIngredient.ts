import { useTranslation } from "react-i18next";

import { formatQuantity } from "../quantity";
import type { IngredientResponse } from "../types";

export const useFormatAmount = () => {
  const { t } = useTranslation("recipes");
  return ({ quantity, unit }: Pick<IngredientResponse, "quantity" | "unit">): string => {
    if (quantity === null) {
      return t("detail.quantoBasta");
    }
    const amount = formatQuantity(quantity);
    return unit === null ? amount : `${amount} ${t(`units.${unit}`, { count: Number(quantity) })}`;
  };
};
