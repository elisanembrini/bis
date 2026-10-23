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
import { I18nextProvider } from "react-i18next";

import i18n from "../src/i18n";
import { theme } from "../src/theme";

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
      <MantineProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </MantineProvider>
    </I18nextProvider>
  );
};

const preview: Preview = {
  decorators: [withRouter, withProviders],
};

export default preview;
