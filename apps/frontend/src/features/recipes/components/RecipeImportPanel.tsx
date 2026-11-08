import { Button, SegmentedControl, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { InfoMessage } from "../../../components/Messages";
import { SectionTitle } from "../../../components/SectionTitle";
import type { RecipeImportInput } from "../types";

type ImportSource = "text" | "link";

type RecipeImportPanelProps = {
  onImport: (source: RecipeImportInput) => void;
  isLoading?: boolean;
  isDone?: boolean;
  errorCode?: AppErrorCode | undefined;
};

const isImportSource = (value: string): value is ImportSource =>
  value === "text" || value === "link";

export function RecipeImportPanel({
  onImport,
  isLoading = false,
  isDone = false,
  errorCode,
}: RecipeImportPanelProps) {
  const { t } = useTranslation("recipes");
  const [source, setSource] = useState<ImportSource>("text");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const value = source === "text" ? text : link;

  return (
    <Stack
      component="form"
      gap="sm"
      aria-label={t("import.title")}
      onSubmit={(event) => {
        event.preventDefault();
        onImport(source === "text" ? { text } : { url: link });
      }}
    >
      <SectionTitle>{t("import.title")}</SectionTitle>
      <Text c="dimmed">{t("import.description")}</Text>
      <SegmentedControl
        aria-label={t("import.source")}
        value={source}
        onChange={(next) => {
          if (isImportSource(next)) {
            setSource(next);
          }
        }}
        data={[
          { value: "text", label: t("import.sourceText") },
          { value: "link", label: t("import.sourceLink") },
        ]}
        disabled={isLoading}
      />
      {source === "text" ? (
        <Textarea
          label={t("import.textLabel")}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          minRows={5}
          autosize
          disabled={isLoading}
        />
      ) : (
        <TextInput
          label={t("import.linkLabel")}
          type="url"
          value={link}
          onChange={(event) => setLink(event.currentTarget.value)}
          disabled={isLoading}
        />
      )}
      <Button type="submit" color="ink" loading={isLoading} disabled={value.trim() === ""}>
        {t("import.submit")}
      </Button>
      {isLoading && <Text c="dimmed">{t("import.loading")}</Text>}
      <FormError code={errorCode} />
      {isDone && !isLoading && errorCode === undefined && <InfoMessage title={t("import.done")} />}
    </Stack>
  );
}
