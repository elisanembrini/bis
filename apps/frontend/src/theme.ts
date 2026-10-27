import {
  ActionIcon,
  Badge,
  Button,
  createTheme,
  rem,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

const inchiostro: MantineColorsTuple = [
  "#F2F3F6",
  "#E0E3EB",
  "#C1C7D7",
  "#9EA7C0",
  "#7782A6",
  "#4B5A89",
  "#23366F",
  "#1D2C5B",
  "#172449",
  "#121C3A",
];

const pomodoro: MantineColorsTuple = [
  "#FBF3F2",
  "#F6E4E0",
  "#EEC8C1",
  "#E4A99E",
  "#D98576",
  "#CD5E4A",
  "#C23B22",
  "#9F301C",
  "#802716",
  "#651F12",
];

export const brand = {
  carta: "#FBFAF6",
  quadretti: "#D8DFEE",
  rigaQuaderno: "#C9D1E4",
  grigliaSfondo: "#E4E8F2",
  testo: "#1E2233",
  testoSecondario: "#4A5168",
  fontScritturaAMano: "Kalam, cursive",
} as const;

export const theme = createTheme({
  primaryColor: "inchiostro",
  primaryShade: 6,
  colors: { inchiostro, pomodoro },
  black: brand.testo,
  fontFamily: "Figtree, system-ui, sans-serif",
  headings: {
    fontFamily: "Figtree, system-ui, sans-serif",
    fontWeight: "700",
  },
  defaultRadius: "md",
  radius: {
    xs: rem(4),
    sm: rem(8),
    md: rem(12),
    lg: rem(16),
    xl: rem(32),
  },
  focusRing: "auto",
  components: {
    Button: Button.extend({
      defaultProps: { size: "lg" },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { size: "xl", variant: "light" },
    }),
    Badge: Badge.extend({
      defaultProps: { variant: "light", radius: "xl", size: "lg" },
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    "--bis-font-scrittura-a-mano": brand.fontScritturaAMano,
    "--bis-color-quadretti": brand.quadretti,
    "--bis-color-riga-quaderno": brand.rigaQuaderno,
    "--bis-color-griglia-sfondo": brand.grigliaSfondo,
  },
  light: {
    "--mantine-color-body": brand.carta,
    "--mantine-color-text": brand.testo,
    "--mantine-color-dimmed": brand.testoSecondario,
    "--mantine-color-default-border": brand.quadretti,
  },
  dark: {},
});
