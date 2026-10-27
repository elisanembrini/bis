import { Box, SegmentedControl, Stack, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { SearchIcon } from "../../../components/icons";

export type SearchMode = "title" | "ingredient";

type SearchBarProps = {
  value: string;
  mode: SearchMode;
  onChange: (value: string) => void;
  onModeChange: (mode: SearchMode) => void;
};

const isSearchMode = (value: string): value is SearchMode =>
  value === "title" || value === "ingredient";

export function SearchBar({ value, mode, onChange, onModeChange }: SearchBarProps) {
  const { t } = useTranslation("recipes");

  return (
    <Box component="search">
      <Stack gap="xs">
        <TextInput
          type="search"
          aria-label={t("search.label")}
          placeholder={
            mode === "title" ? t("search.placeholderTitle") : t("search.placeholderIngredient")
          }
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          size="md"
          leftSection={<SearchIcon />}
        />
        <SegmentedControl
          aria-label={t("search.mode")}
          value={mode}
          onChange={(next) => {
            if (isSearchMode(next)) {
              onModeChange(next);
            }
          }}
          data={[
            { value: "title", label: t("search.byTitle") },
            { value: "ingredient", label: t("search.byIngredient") },
          ]}
          fullWidth
        />
      </Stack>
    </Box>
  );
}
