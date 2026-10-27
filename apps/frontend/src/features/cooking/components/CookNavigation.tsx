import { Button, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ArrowLeftIcon, ArrowRightIcon } from "../../../components/icons";

type CookNavigationProps = {
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
};

const NAVIGATION_HEIGHT = 64;

export function CookNavigation({
  isFirst,
  isLast,
  onPrevious,
  onNext,
  onFinish,
}: CookNavigationProps) {
  const { t } = useTranslation("cooking");

  return (
    <Stack gap="sm">
      <Button
        fullWidth
        h={NAVIGATION_HEIGHT}
        rightSection={isLast ? null : <ArrowRightIcon size={28} />}
        onClick={isLast ? onFinish : onNext}
      >
        {isLast ? t("finish") : t("next")}
      </Button>
      <Button
        fullWidth
        h={NAVIGATION_HEIGHT}
        variant="default"
        leftSection={<ArrowLeftIcon size={28} />}
        onClick={onPrevious}
        disabled={isFirst}
      >
        {t("previous")}
      </Button>
    </Stack>
  );
}
