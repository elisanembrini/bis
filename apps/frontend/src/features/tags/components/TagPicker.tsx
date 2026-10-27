import { Chip, Fieldset, Group, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { AnchorLink } from "../../../components/AnchorLink";
import type { TagResponse } from "../types";

type TagPickerProps = {
  tags: TagResponse[];
  value: string[];
  onChange: (tagIds: string[]) => void;
};

export function TagPicker({ tags, value, onChange }: TagPickerProps) {
  const { t } = useTranslation("tags");

  return (
    <Fieldset legend={t("picker.label")} variant="unstyled">
      <Stack gap="xs">
        <Chip.Group multiple value={value} onChange={onChange}>
          <Group gap="xs">
            {tags.map((tag) => (
              <Chip key={tag.id} value={tag.id} size="lg">
                {tag.name}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <AnchorLink to="/tags">{t("picker.manage")}</AnchorLink>
      </Stack>
    </Fieldset>
  );
}
