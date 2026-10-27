import { Alert, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { ButtonLink } from "../../../components/ButtonLink";
import { FormError } from "../../../components/FormError";
import { GoogleSignInButton } from "../../auth/components/GoogleSignInButton";
import { OrDivider } from "../../auth/components/OrDivider";
import type { InviteState } from "../inviteState";

type InviteCardProps = {
  token: string;
  inviterName: string;
  state: InviteState;
  returnTo: string;
  onAccept: () => void;
  isAccepting?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function InviteCard({
  token,
  inviterName,
  state,
  returnTo,
  onAccept,
  isAccepting = false,
  errorCode,
}: InviteCardProps) {
  const { t } = useTranslation("household");

  return (
    <Stack gap="lg">
      <Title order={1} size="h2">
        {t("invitePage.heading", { name: inviterName })}
      </Title>
      <FormError code={errorCode} />
      {state.kind === "anonymous" && (
        <Stack gap="md">
          <Text>{t("invitePage.anonymous")}</Text>
          <GoogleSignInButton inviteToken={token} />
          <OrDivider />
          <Group grow>
            <ButtonLink to="/register" search={{ invite: token }}>
              {t("invitePage.register")}
            </ButtonLink>
            <ButtonLink to="/login" search={{ redirect: returnTo }} variant="default">
              {t("invitePage.login")}
            </ButtonLink>
          </Group>
        </Stack>
      )}
      {state.kind === "canJoin" && (
        <Stack gap="md">
          <Alert color="yellow" title={t("invitePage.replaceWarning")} />
          <Button onClick={onAccept} loading={isAccepting}>
            {t("invitePage.accept")}
          </Button>
        </Stack>
      )}
      {(state.kind === "mustLeave" || state.kind === "alreadyMember") && (
        <Stack gap="md">
          <FormError
            code={state.kind === "mustLeave" ? "MUST_LEAVE_HOUSEHOLD" : "ALREADY_IN_HOUSEHOLD"}
          />
          <AnchorLink to="/household">{t("invitePage.goToHousehold")}</AnchorLink>
        </Stack>
      )}
    </Stack>
  );
}
