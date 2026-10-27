import { Chip, Fieldset, Group, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { AnchorLink } from "../../../components/AnchorLink";
import type { TagResponse } from "../types";

type TagFilterProps = {
  tags: TagResponse[];
  selectedTagId: string | undefined;
  onChange: (tagId: string | undefined) => void;
};

export function TagFilter({ tags, selectedTagId, onChange }: TagFilterProps) {
  const { t } = useTranslation("tags");

  return (
    <Fieldset legend={t("filter.label")} variant="unstyled">
      <Stack gap="xs">
        <Group gap="xs">
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              size="sm"
              checked={tag.id === selectedTagId}
              onChange={() => onChange(tag.id === selectedTagId ? undefined : tag.id)}
            >
              {tag.name}
            </Chip>
          ))}
        </Group>
        <AnchorLink to="/tags" size="sm">
          {t("filter.manage")}
        </AnchorLink>
      </Stack>
    </Fieldset>
  );
}
