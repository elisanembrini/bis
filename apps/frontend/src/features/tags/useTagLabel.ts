import { useTranslation } from "react-i18next";

const STARTER_KEYS = [
  "starters",
  "first_courses",
  "main_courses",
  "side_dishes",
  "desserts",
  "vegetarian",
  "quick",
] as const;

type StarterKey = (typeof STARTER_KEYS)[number];

const isStarterKey = (key: string | null): key is StarterKey =>
  STARTER_KEYS.some((starter) => starter === key);

type LabelledTag = { name: string; key: string | null };

export const useTagLabel = () => {
  const { t } = useTranslation("tags");

  return (tag: LabelledTag): string =>
    isStarterKey(tag.key) ? t(`starterTags.${tag.key}`) : tag.name;
};
