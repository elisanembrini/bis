import { Button, FileButton, Fieldset, Group, Image, Progress, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../api/errors";
import { FormError } from "./FormError";
import { PhotoIcon } from "./icons";

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

type PhotoInputProps = {
  label: string;
  imageSrc?: string | undefined;
  progress?: number | undefined;
  errorCode?: AppErrorCode | undefined;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

export function PhotoInput({
  label,
  imageSrc,
  progress,
  errorCode,
  disabled = false,
  onSelect,
  onRemove,
}: PhotoInputProps) {
  const { t } = useTranslation();
  const isUploading = progress !== undefined;
  const selectLabel = imageSrc === undefined ? t("photo.add") : t("photo.change");

  return (
    <Fieldset legend={label} variant="unstyled">
      <Stack gap="xs">
        {imageSrc !== undefined && (
          <Image src={imageSrc} alt={label} h={180} radius="md" fit="cover" />
        )}
        {isUploading && (
          <Progress value={Math.round(progress * 100)} aria-label={t("photo.uploading")} animated />
        )}
        <FormError code={errorCode} />
        <Group gap="xs">
          <FileButton
            accept={PHOTO_ACCEPT}
            disabled={disabled || isUploading}
            onChange={(file) => {
              if (file !== null) {
                onSelect(file);
              }
            }}
            inputProps={{ "aria-label": `${label}: ${selectLabel}` }}
          >
            {(props) => (
              <Button
                {...props}
                variant="light"
                leftSection={<PhotoIcon size={18} />}
                disabled={disabled || isUploading}
              >
                {selectLabel}
              </Button>
            )}
          </FileButton>
          {imageSrc !== undefined && !isUploading && (
            <Button variant="subtle" color="red" onClick={onRemove} disabled={disabled}>
              {t("photo.remove")}
            </Button>
          )}
        </Group>
      </Stack>
    </Fieldset>
  );
}
