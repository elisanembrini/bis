import { Box, Image } from "@mantine/core";
import { useTranslation } from "react-i18next";

const LOGO_MIN_WIDTH = 64;

type LogoProps = {
  width?: number;
  variant?: "light" | "dark";
};

export function Logo({ width = LOGO_MIN_WIDTH, variant = "light" }: LogoProps) {
  const { t } = useTranslation();

  return (
    <Box p="md">
      <Image
        src={variant === "light" ? "/brand/logo.svg" : "/brand/logo-chiaro.svg"}
        alt={t("appName")}
        w={Math.max(width, LOGO_MIN_WIDTH)}
        h="auto"
        fit="contain"
      />
    </Box>
  );
}
