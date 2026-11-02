# Bis visual identity: the Quaderno direction

*Quaderno* means "notebook".

## Idea

Bis grew out of the notebook where you write down the recipes that turned out well. The interface is clean, clear and readable in the kitchen. Its character comes from a single distinctive mark: handwriting in ink blue with a tomato-red underline. Everything else stays sober, so that mark stands out.

## Colors

| Name              | Value   | Token                           | Use                                                  |
| ----------------- | ------- | ------------------------------- | ---------------------------------------------------- |
| Ink               | #23366F | `ink.6` (primary color)         | Main actions, titles, links, active icons            |
| Tomato            | #C23B22 | `tomato.6`                      | Accent: "Fai il bis", logo underline, active timer  |
| Paper             | #FBFAF6 | `--mantine-color-body`          | App background                                       |
| Squares           | #D8DFEE | `--bis-color-squares`           | Borders of fields, cards and containers              |
| Notebook line     | #C9D1E4 | `--bis-color-notebook-line`     | Dashed separators in lists                           |
| Text              | #1E2233 | `--mantine-color-text`          | Main text                                            |
| Secondary text    | #4A5168 | `--mantine-color-dimmed`        | Times, notes, captions                               |

Rules:

- Tomato is an accent: at most one tomato element per screen, besides the logo.
- Errors: `tomato.8`, always with an icon and a message, never with color alone. The "Fai il bis" button uses the outline style, so it is not mistaken for an error.
- Confirmations: Mantine's `green.8`, always with an icon and a message.
- Colors are used only through the theme tokens in `src/theme.ts`. Never hexadecimal values written in components.
- For now the app has only the light theme: `MantineProvider` uses `forceColorScheme="light"`.

## Typography

- **Figtree** (400, 600, 700) for the whole interface: texts, lists, fields, buttons, section titles.
- **Kalam** (700) only for a few moments: the logo, the recipe title on the detail page and in cooking mode, the step number in cooking mode, the titles of empty states. Never for long texts, buttons, labels, lists or fields.
- Recipe title on the detail page: Kalam 32 px, ink color.
- Section titles ("Ingredienti", "Passaggi", "Note"): Figtree 600, 18 px, sentence case. No all-caps labels.
- Step text: Figtree 400, 17 px, line height 1.5.
- Fonts are hosted by the app through the `@fontsource/figtree` and `@fontsource/kalam` packages, imported in `main.tsx`. Google Fonts servers are not used, so no user data goes to third parties.

## Shapes and spacing

- Radius `md` (12 px) for buttons, fields, cards and images.
- Labels and badges are pill-shaped (`radius="xl"`).
- No shadows: depth comes from 1 px borders in the squares color.
- Page side margin: 20 px on phones, 32 px on tablets.
- Spacing from Mantine's scale (`xs` to `xl`), never arbitrary values.

## The grid pattern

The grid background (1 px lines in `--bis-color-background-grid` every 24 px) is the nod to the notebook. It is used only on sign-in and sign-up, empty states and the invitation page. Never behind lists, forms or long texts, where it would reduce legibility.

## Components

- **Primary button**: filled ink `Button`, size `lg` (the theme default). One per screen.
- **Fai il bis**: `Button` with `variant="outline"` and `color="tomato"`.
- **Tags**: `Badge` in the light ink style (the theme default).
- **Servings**: two `ActionIcon`s (minus and plus) with the value in the middle, inside a white container with a squares border.
- **Ingredient list**: name on the left, quantity on the right in Figtree 600, 1 px dashed separators in the notebook-line color, like the lines of a notebook.
- **Photo of the dish**: at the top of the detail page, full width, 16:10 ratio, rounded corners only on the thumbnails in lists.
- **Icons**: Tabler Icons (`@tabler/icons-react`), stroke 2, 20 px in the interface and 28 px in cooking mode.

## Cooking mode

- Paper background, no grid pattern.
- Step number in Kalam ink, 48 px; step text in Figtree 28 px, line height 1.4.
- Forward and back buttons at full width, at least 64 px tall: they are used with wet or dirty hands.
- Running timers in tomato, clearly visible; at the end, a sound and a visual alert.

## Accessibility

- Verified color pairs: ink on paper 11:1, secondary text on paper above 6:1, tomato on white 5.3:1, white text on ink 11.5:1.
- The shades `ink.0` to `ink.4` and `tomato.0` to `tomato.5` are never used for text on a light background: they are for backgrounds and decoration.
- Minimum touch target 44 px (the theme sets `ActionIcon` to `xl` and `Button` to `lg`).
- Keyboard focus always visible.
- No information conveyed by color alone.

## Logo and icons

The files are in `apps/frontend/public/brand/`:

- `logo.svg`: logo for light backgrounds.
- `logo-chiaro.svg`: logo for an ink background ("chiaro" means light).
- `icon.svg`, `icon-192.png`, `icon-512.png`: app and PWA icon.
- `icon-maskable.svg`, `icon-maskable-512.png`: full-bleed icon for Android.
- `favicon-32.png`: favicon.

The logo is never recolored, distorted or recreated with the font: these files are always used. Minimum width 64 px, with at least 16 px of clear space around it.

## Mantine theme

The theme is in `apps/frontend/src/theme.ts`, which exports `theme` and `cssVariablesResolver`:

```tsx
<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
```

The same provider is used in the global Storybook decorator.
