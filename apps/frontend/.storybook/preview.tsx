import "@fontsource/figtree/400.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/kalam/700.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import type { Decorator, Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "../src/i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_NAMES,
  type Language,
  SUPPORTED_LANGUAGES,
  isLanguage,
} from "../src/i18n/languages";
import { cssVariablesResolver, theme } from "../src/theme";

const withRouter: Decorator = (Story) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: Story }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return <RouterProvider router={router} />;
};

const withProviders: Decorator = (Story) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <I18nextProvider i18n={i18n}>
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="light"
      >
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </MantineProvider>
    </I18nextProvider>
  );
};

function LanguageSync({ language, children }: { language: Language; children: ReactNode }) {
  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  return children;
}

const withLanguage: Decorator = (Story, context) => {
  const locale: unknown = context.globals["locale"];

  return (
    <LanguageSync language={isLanguage(locale) ? locale : DEFAULT_LANGUAGE}>
      <Story />
    </LanguageSync>
  );
};

const preview: Preview = {
  decorators: [withRouter, withProviders, withLanguage],
  initialGlobals: { locale: DEFAULT_LANGUAGE },
  globalTypes: {
    locale: {
      description: "Interface language",
      toolbar: {
        icon: "globe",
        dynamicTitle: true,
        items: SUPPORTED_LANGUAGES.map((code) => ({ value: code, title: LANGUAGE_NAMES[code] })),
      },
    },
  },
};

export default preview;
