# Identità visiva di Bis: direzione Quaderno

## Idea

Bis nasce dal quaderno su cui si scrivono le ricette riuscite. L'interfaccia è pulita, chiara e leggibile in cucina. Il carattere viene da un solo segno distintivo: la scrittura a mano blu inchiostro con la sottolineatura rosso pomodoro. Tutto il resto resta sobrio, così quel segno si nota.

## Colori

| Nome              | Valore  | Token                            | Uso                                                          |
| ----------------- | ------- | -------------------------------- | ------------------------------------------------------------ |
| Inchiostro        | #23366F | `inchiostro.6` (colore primario) | Azioni principali, titoli, link, icone attive                |
| Pomodoro          | #C23B22 | `pomodoro.6`                     | Accento: "Fai il bis", sottolineatura del logo, timer attivo |
| Carta             | #FBFAF6 | `--mantine-color-body`           | Sfondo dell'app                                              |
| Quadretti         | #D8DFEE | `--bis-color-quadretti`          | Bordi di campi, card e contenitori                           |
| Riga del quaderno | #C9D1E4 | `--bis-color-riga-quaderno`      | Separatori tratteggiati nelle liste                          |
| Testo             | #1E2233 | `--mantine-color-text`           | Testo principale                                             |
| Testo secondario  | #4A5168 | `--mantine-color-dimmed`         | Tempi, note, didascalie                                      |

Regole:

- Il pomodoro è un accento: al massimo un elemento pomodoro per schermata, oltre al logo.
- Errori: `pomodoro.8`, sempre con icona e messaggio, mai solo con il colore. Il pulsante "Fai il bis" è in stile outline, così non si confonde con un errore.
- Conferme: colore `green.8` di Mantine, sempre con icona e messaggio.
- I colori si usano solo tramite i token del tema in `src/theme.ts`. Mai valori esadecimali scritti nei componenti.
- Per ora l'app ha solo il tema chiaro: `MantineProvider` usa `forceColorScheme="light"`.

## Tipografia

- **Figtree** (400, 600, 700) per tutta l'interfaccia: testi, liste, campi, pulsanti, titoli delle sezioni.
- **Kalam** (700) solo per pochi momenti: il logo, il titolo della ricetta nella pagina di dettaglio e in modalità cucina, il numero del passaggio in modalità cucina, i titoli degli stati vuoti. Mai per testi lunghi, pulsanti, etichette, liste o campi.
- Titolo ricetta nel dettaglio: Kalam 32 px, colore inchiostro.
- Titoli di sezione (Ingredienti, Passaggi, Note): Figtree 600, 18 px, iniziale maiuscola e resto minuscolo. Niente etichette tutte in maiuscolo.
- Testo dei passaggi: Figtree 400, 17 px, interlinea 1,5.
- I font sono ospitati dall'app tramite i pacchetti `@fontsource/figtree` e `@fontsource/kalam`, importati in `main.tsx`. Non si usano i server di Google Fonts, così nessun dato degli utenti passa a terzi.

## Forme e spazi

- Raggio `md` (12 px) per pulsanti, campi, card e immagini.
- Etichette e badge a pillola (`radius="xl"`).
- Niente ombre: la profondità si dà con bordi da 1 px color quadretti.
- Margine laterale delle pagine: 20 px su telefono, 32 px su tablet.
- Spaziature dalla scala di Mantine (`xs` … `xl`), mai valori arbitrari.

## Il motivo a quadretti

Lo sfondo a quadretti (righe di 1 px `--bis-color-griglia-sfondo` ogni 24 px) è il richiamo al quaderno. Si usa solo in accesso e registrazione, stati vuoti e pagina di invito. Mai dietro liste, moduli o testi lunghi, dove ridurrebbe la leggibilità.

## Componenti

- **Pulsante principale**: `Button` pieno inchiostro, dimensione `lg` (predefinita nel tema). Uno per schermata.
- **Fai il bis**: `Button` con `variant="outline"` e `color="pomodoro"`.
- **Etichette**: `Badge` in stile light inchiostro (predefinito nel tema).
- **Porzioni**: due `ActionIcon` (meno e più) con il valore al centro, dentro un contenitore bianco con bordo quadretti.
- **Lista ingredienti**: nome a sinistra, quantità a destra in Figtree 600, separatori tratteggiati 1 px color riga del quaderno, come le righe di un quaderno.
- **Foto del piatto**: in cima al dettaglio, a tutta larghezza, rapporto 16:10, angoli arrotondati solo nelle miniature degli elenchi.
- **Icone**: Tabler Icons (`@tabler/icons-react`), tratto 2, dimensione 20 px nell'interfaccia e 28 px in modalità cucina.

## Modalità cucina

- Sfondo carta, nessun motivo a quadretti.
- Numero del passaggio in Kalam inchiostro, 48 px; testo del passaggio in Figtree 28 px, interlinea 1,4.
- Pulsanti avanti e indietro a tutta larghezza, alti almeno 64 px: si usano con le mani bagnate o sporche.
- Timer in corso in pomodoro, ben visibile; al termine avviso sonoro e visivo.

## Accessibilità

- Coppie di colori verificate: inchiostro su carta 11:1, testo secondario su carta oltre 6:1, pomodoro su bianco 5,3:1, testo bianco su inchiostro 11,5:1.
- Le tonalità `inchiostro.0` … `inchiostro.4` e `pomodoro.0` … `pomodoro.5` non si usano mai per testo su sfondo chiaro: servono per sfondi e decorazioni.
- Area toccabile minima 44 px (il tema imposta `ActionIcon` a `xl` e `Button` a `lg`).
- Focus da tastiera sempre visibile.
- Nessuna informazione affidata al solo colore.

## Logo e icone

I file sono in `apps/frontend/public/brand/`:

- `logo.svg`: logo per sfondi chiari.
- `logo-chiaro.svg`: logo per sfondo inchiostro.
- `icon.svg`, `icon-192.png`, `icon-512.png`: icona dell'app e della PWA.
- `icon-maskable.svg`, `icon-maskable-512.png`: icona a tutto campo per Android.
- `favicon-32.png`: favicon.

Il logo non si ricolora, non si deforma e non si ricrea con il font: si usano sempre questi file. Larghezza minima 64 px, con almeno 16 px di spazio libero intorno.

## Tema Mantine

Il tema è in `apps/frontend/src/theme.ts`, che esporta `theme` e `cssVariablesResolver`:

```tsx
<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme="light">
```

Lo stesso provider va usato nel decorator globale di Storybook.
