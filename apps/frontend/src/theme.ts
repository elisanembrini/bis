import {
  ActionIcon,
  Badge,
  Button,
  createTheme,
  rem,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

const ink: MantineColorsTuple = [
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

const tomato: MantineColorsTuple = [
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
  paper: "#FBFAF6",
  squares: "#D8DFEE",
  notebookLine: "#C9D1E4",
  backgroundGrid: "#E4E8F2",
  text: "#1E2233",
  textSecondary: "#4A5168",
  handwritingFont: "Kalam, cursive",
} as const;

export const theme = createTheme({
  primaryColor: "ink",
  primaryShade: 6,
  colors: { ink, tomato },
  black: brand.text,
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
    "--bis-font-handwriting": brand.handwritingFont,
    "--bis-color-squares": brand.squares,
    "--bis-color-notebook-line": brand.notebookLine,
    "--bis-color-background-grid": brand.backgroundGrid,
  },
  light: {
    "--mantine-color-body": brand.paper,
    "--mantine-color-text": brand.text,
    "--mantine-color-dimmed": brand.textSecondary,
    "--mantine-color-default-border": brand.squares,
  },
  dark: {},
});
