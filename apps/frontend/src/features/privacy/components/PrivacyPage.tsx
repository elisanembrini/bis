import { Anchor, List, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { AnchorLink } from "../../../components/AnchorLink";
import { PageContainer } from "../../../components/PageContainer";
import { SectionTitle } from "../../../components/SectionTitle";
import { PRIVACY_CONTACT_EMAIL } from "../constants";

const CONTACT_SECTION = "controller";

export function PrivacyPage() {
  const { t } = useTranslation("privacy");
  const sections = Object.entries(t("sections", { returnObjects: true }));

  return (
    <PageContainer>
      <Stack gap="lg">
        <AnchorLink to="/" size="sm">
          {t("back")}
        </AnchorLink>
        <Stack gap="xs">
          <Title order={1} size="h2">
            {t("title")}
          </Title>
          <Text c="dimmed" size="sm">
            {t("updated")}
          </Text>
        </Stack>
        <Text>{t("intro")}</Text>
        {sections.map(([key, section]) => {
          const items = "items" in section ? section.items : [];
          return (
            <Stack key={key} gap="xs" component="section">
              <SectionTitle>{section.title}</SectionTitle>
              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph}>{paragraph}</Text>
              ))}
              {items.length > 0 ? (
                <List spacing="xs">
                  {items.map((item) => (
                    <List.Item key={item}>{item}</List.Item>
                  ))}
                </List>
              ) : null}
              {key === CONTACT_SECTION ? (
                <Text>
                  {t("contactLabel")}{" "}
                  <Anchor href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</Anchor>
                </Text>
              ) : null}
            </Stack>
          );
        })}
      </Stack>
    </PageContainer>
  );
}
