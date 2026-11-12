import { Group, NativeSelect } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { MIN_RATING_FILTERS, type RecipeSort } from "../rating";

type RatingControlsProps = {
  sort: RecipeSort | undefined;
  minRating: number | undefined;
  onSortChange: (sort: RecipeSort | undefined) => void;
  onMinRatingChange: (minRating: number | undefined) => void;
};

export function RatingControls({
  sort,
  minRating,
  onSortChange,
  onMinRatingChange,
}: RatingControlsProps) {
  const { t } = useTranslation("recipes");

  return (
    <Group grow align="flex-start">
      <NativeSelect
        label={t("sort.label")}
        value={sort ?? ""}
        data={[
          { value: "", label: t("sort.recent") },
          { value: "rating", label: t("sort.rating") },
        ]}
        onChange={(event) =>
          onSortChange(event.currentTarget.value === "rating" ? "rating" : undefined)
        }
      />
      <NativeSelect
        label={t("sort.minRating")}
        value={minRating === undefined ? "" : String(minRating)}
        data={[
          { value: "", label: t("sort.anyRating") },
          ...MIN_RATING_FILTERS.map((rating) => ({
            value: String(rating),
            label: rating === 10 ? t("sort.topRating", { rating }) : t("sort.atLeast", { rating }),
          })),
        ]}
        onChange={(event) => {
          const next = MIN_RATING_FILTERS.find(
            (rating) => String(rating) === event.currentTarget.value,
          );
          onMinRatingChange(next);
        }}
      />
    </Group>
  );
}
