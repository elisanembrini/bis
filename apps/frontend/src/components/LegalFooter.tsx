import { Box } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { AnchorLink } from "./AnchorLink";

export function LegalFooter() {
  const { t } = useTranslation();

  return (
    <Box component="footer" ta="center" py="md">
      <AnchorLink to="/privacy" size="sm">
        {t("footer.privacy")}
      </AnchorLink>
    </Box>
  );
}
