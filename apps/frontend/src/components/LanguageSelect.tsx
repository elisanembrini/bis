import { NativeSelect } from "@mantine/core";
import { useTranslation } from "react-i18next";

export type LanguageOption = { code: string; name: string };

type LanguageSelectProps = {
  languages: readonly LanguageOption[];
  value: string;
  onChange: (code: string) => void;
};

const SELECT_WIDTH = 150;

export function LanguageSelect({ languages, value, onChange }: LanguageSelectProps) {
  const { t } = useTranslation();

  if (languages.length < 2) {
    return null;
  }

  return (
    <NativeSelect
      aria-label={t("language.label")}
      w={SELECT_WIDTH}
      ml="auto"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      data={languages.map((language) => ({ value: language.code, label: language.name }))}
    />
  );
}
