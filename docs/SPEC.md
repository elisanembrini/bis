# Specification: Bis

Version: MVP 1.0
Last updated: 2 November 2026

The product interface is in Italian. Interface texts, labels and voice commands are quoted in Italian, with an English gloss where it helps.

## 1. Problem

When a recipe turns out well, I write it down in a notebook, because I won't remember the details otherwise and couldn't make it again. The notebook has two problems: in the kitchen it risks getting dirty, and finding a recipe takes time. Existing recipe apps are mostly designed to collect recipes found online, not to keep your own version of a dish and follow it with your hands full.

## 2. Users and roles

The app is used by a small group of people who live in the same home. Everyone has their own recipe book and decides what to share, and with whom.

| Role            | Can                                                                                                                                                                                  | Cannot                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Household owner | Everything a member can do. Generate invitation links. Remove members from the household.                                                                                            | View or edit other people's recipes that are not shared with them.                  |
| Member          | Manage their own recipes and tags. Share their own recipes with chosen members. View the recipes shared with them and copy them into their own recipe book. Leave the household.    | Edit other people's recipes. Invite people. View recipes that are not shared with them. |

Each user belongs to exactly one household. Anyone who signs up without an invitation becomes the owner of a new household.

## 3. Goals

- I have moved the recipes from the notebook into the app and stopped using the notebook.
- I find any recipe, by name or by ingredient, in under 10 seconds.
- I can follow a recipe from start to finish without touching the screen, using voice and timers, on Chrome for Android.
- Saving a new recipe from a phone takes less than 5 minutes.

## 4. Non-goals

- A history of the times a recipe was made again and of the changes made to it.
- Voice dictation that turns a spoken account into a structured recipe.
- Public sharing, or sharing with people outside the household.
- Languages other than Italian in the first release. The interface is prepared for them (see section 10), but only the Italian translation is provided.
- An interface optimized for desktop computers.
- Native apps for the App Store and Google Play.

## 5. Features

### F1: Sign-up and sign-in

- Description: sign in with email and password or with Google. Password recovery by email.
- Priority: must
- Acceptance criteria:
  - [ ] Given a new user, when they sign up with email and password, then the account is created together with a new household of which they are the owner.
  - [ ] Given a registered user, when they sign in with correct credentials, then they enter the app and the session is kept through an httpOnly cookie.
  - [ ] Given a user, when they choose "Accedi con Google" (sign in with Google) and authorize, then they enter the app; if the email already exists, the Google account is linked to the existing one.
  - [ ] Given a user who forgot their password, when they request recovery, then they receive a link valid for 1 hour to set a new one.
  - [ ] Given a signed-in user, when they sign out, then the session is invalidated on the server.
- Edge cases and errors: wrong credentials (generic message that does not reveal whether the email exists), too many sign-in attempts (temporary block), expired or already used recovery link.

### F2: Household and invitations

- Description: the household owner invites the people they live with through a link.
- Priority: must
- Acceptance criteria:
  - [ ] Given the owner, when they generate an invitation, then they get a copyable link valid for 7 days and usable only once.
  - [ ] Given a valid link, when a person opens it and signs up or signs in, then they join the household as a member.
  - [ ] Given the owner, when they remove a member, then the shares to and from that member are revoked; copies that were already made stay with whoever made them.
  - [ ] Given a member, when they leave the household, then they become the owner of a new empty household and keep their own recipes.
- Edge cases and errors: expired link, already used link, user who already belongs to another household (they must leave it first).

### F3: Recipe management

- Description: create, view, edit and delete your own recipes.
- Priority: must
- Recipe content: title, photo of the dish, ingredients (quantity, unit, name), ordered steps (text, optional photo, optional timer duration), notes, preparation time, cooking time, number of servings, tags.
- Acceptance criteria:
  - [ ] Given a user, when they save a recipe with at least a title, one ingredient and one step, then the recipe appears in their recipe book.
  - [ ] Given a user, when they add an ingredient without a quantity, then it is shown as "q.b." (*quanto basta*, "as needed").
  - [ ] Given a user, when they reorder steps or ingredients, then the new order is saved.
  - [ ] Given a user, when they delete a recipe, then they are asked for confirmation and, after confirming, the recipe and its photos are deleted.
  - [ ] Only the author of a recipe can edit or delete it.
- Edge cases and errors: missing required fields, photo that is too large or in an unsupported format, connection lost while saving (the draft must not be lost).

### F4: Servings with recalculated quantities

- Priority: must
- Acceptance criteria:
  - [ ] Given a recipe for 4 servings, when the user sets 2 servings in the view, then all quantities are halved.
  - [ ] "q.b." ingredients are not recalculated.
  - [ ] Recalculated quantities are rounded readably (for example "1,5" rather than "1,4999"; the interface uses the Italian decimal comma).
  - [ ] The recalculation changes only the view and does not modify the saved recipe.

### F5: Tags

- Priority: must
- Acceptance criteria:
  - [ ] Every user finds a starter list: Antipasti (starters), Primi (first courses), Secondi (main courses), Contorni (side dishes), Dolci (desserts), Vegetariano (vegetarian), Veloce (quick).
  - [ ] Every user can create personal tags, visible only to them.
  - [ ] A recipe can have several tags.
- Edge cases and errors: duplicate tag for the same user, deleting a tag that is in use (it is removed from the recipes, the recipes stay).

### F6: Search

- Description: find recipes by name or by ingredient.
- Priority: must
- Acceptance criteria:
  - [ ] Given a search text, when the user types it, then they see the recipes whose title contains it, regardless of case.
  - [ ] Given an ingredient, when the user searches by ingredient, then they see the recipes that contain it.
  - [ ] The search includes the user's own recipes and the ones shared with them, telling them apart visually.
  - [ ] Every result shows the photo of the dish and the title.
  - [ ] Without a search, recipes are ordered from the most recent.

### F7: Sharing and copying

- Priority: must
- Acceptance criteria:
  - [ ] Given one of their own recipes, when the user chooses one or more household members, then the recipe appears in the "Condivise con me" (shared with me) section of those members.
  - [ ] Given a share, when the author revokes it, then the recipe disappears for that member.
  - [ ] Given a shared recipe, when the recipient opens it, then they see it read-only and can use servings and cooking mode.
  - [ ] Given a shared recipe, when the recipient chooses "Fai il bis" (roughly "have seconds"), then they get an independent copy, photos included, which they can edit.
  - [ ] Later changes to the original do not change the copies.

### F8: Cooking mode

- Priority: must
- Acceptance criteria:
  - [ ] Given a user in cooking mode, the screen stays on as long as the mode is active, where the browser supports it.
  - [ ] One step at a time is shown, with large text readable from about one meter away and the photo of the step if present.
  - [ ] Large buttons allow going forward and back.
  - [ ] Where the browser supports speech recognition, the commands "avanti" (next), "indietro" (back), "ripeti" (repeat) and "avvia timer" (start timer) work without touching the screen.
  - [ ] Given a step with a duration, when the user starts the timer, then a countdown starts and keeps running when moving to other steps; at the end an alert sounds.
  - [ ] Where speech recognition is not supported, the interface says so and the buttons remain available.
- Edge cases and errors: microphone permission denied, several timers active at once, accidentally leaving the mode with active timers (ask for confirmation).

### F9: Installable app

- Priority: should
- Acceptance criteria:
  - [x] The app can be added to the home screen on Android and iOS and opens full screen.
- Implementation notes: a hand-written service worker caches only the static assets (never `/api`) and shows an offline page when a navigation fails; the app offers an install banner (native prompt where the browser provides one, manual instructions on iOS) that can be dismissed for good. Using recipes without a connection is out of scope for now.

### F10: Recipe import with a language model

- Priority: could
- Acceptance criteria:
  - [x] Given a configured language model, when the user pastes the text of a recipe or a link to a web page, then the recipe form is filled with a title, servings, times, ingredients (quantity, unit, name) and steps (with timers where the text states a time), ready to be reviewed and edited before saving.
  - [x] Nothing is saved by the import itself: the result is a draft that the user confirms.
  - [x] When the content holds no recipe, or the model answer is not usable, the user gets a clear message and the form is left untouched.
  - [x] Without a configured model the feature is absent: the app works exactly as before.
- Edge cases and errors: link that cannot be read (blocked, too large, not a web page), content with no recipe, malformed model output, too many imports in a short time.
- Security notes: links are downloaded only if they resolve to public addresses (loopback, private, link-local and reserved ranges are refused, also after each redirect, with at most 3 redirects, ports 80 and 443 only, 2 MB and 10 s limits). The downloaded content is treated as untrusted data: it is delimited in the prompt, the model has no tools and its output is constrained to a JSON schema and validated before it reaches the user. Imports are limited per person (20 per hour).
- Known limits: the rate limiter lives in the memory of the backend process, so it resets on restart and is not shared between processes; a host could in theory change its DNS answer between the check and the download; recipes from photos are not supported yet.

## 6. Data model

- `users`: id, email (unique), password_hash (nullable), google_sub (nullable, unique), display_name, created_at.
- `households`: id, owner_id, created_at.
- `household_members`: household_id, user_id (unique: a user belongs to a single household), joined_at.
- `household_invites`: id, household_id, token_hash, created_by, created_at, expires_at, used_at (nullable), used_by (nullable). Only the hash of the token is stored in the database.
- `recipes`: id, owner_id, title, notes, prep_minutes, cook_minutes, servings (> 0), cover_photo_id (nullable), copied_from_recipe_id (nullable), created_at, updated_at.
- `ingredients`: id, recipe_id, position, quantity (decimal, nullable for "q.b."), unit (nullable), name.
- `steps`: id, recipe_id, position, text, timer_seconds (nullable), photo_id (nullable).
- `tags`: id, owner_id (nullable for the starter tags), name, key (nullable: a stable identifier of the starter tags, used to translate their names). Unique on (owner_id, name) and on key.
- `recipe_tags`: recipe_id, tag_id.
- `recipe_shares`: recipe_id, user_id, created_at. Unique on (recipe_id, user_id). The recipient must belong to the same household as the author.
- `photos`: id, owner_id, storage_key, content_type, width, height, size_bytes, created_at.
- `sessions`: id, user_id, token_hash (unique), created_at, expires_at. Server-side sessions; the cookie holds the token, the database only its hash.
- `password_reset_tokens`: id, user_id, token_hash (unique), created_at, expires_at, used_at (nullable). Single-use token valid for 1 hour.
- `login_attempts`: id, email, ip, succeeded, attempted_at. Basis of the sign-in rate limit.

Deleting a recipe cascades to its ingredients, steps, associated tags, shares and photos.

## 7. API

| Method | Path                              | Authorized roles                    | Description                                                              |
| ------ | --------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| POST   | /auth/register                    | Public                              | Sign-up with email and password, optionally with an invitation token     |
| POST   | /auth/login                       | Public                              | Sign-in                                                                  |
| POST   | /auth/logout                      | Authenticated                       | Sign-out                                                                 |
| POST   | /auth/forgot-password             | Public                              | Password recovery request                                                |
| POST   | /auth/reset-password              | Public                              | New password through a token                                             |
| GET    | /auth/google/authorize            | Public                              | Start Google sign-in                                                     |
| GET    | /auth/google/callback             | Public                              | Return from Google                                                       |
| GET    | /me                               | Authenticated                       | Current user and household                                               |
| GET    | /household                        | Member                              | Household and members                                                    |
| POST   | /household/invites                | Household owner                     | Generate an invitation link                                              |
| GET    | /household/invites/{token}        | Public                              | Invitation preview: name of the person who invites                       |
| POST   | /household/invites/{token}/accept | Authenticated                       | Accept an invitation                                                     |
| DELETE | /household/members/{user_id}      | Household owner                     | Remove a member                                                          |
| POST   | /household/leave                  | Member                              | Leave the household                                                      |
| GET    | /recipes                          | Authenticated                       | List with parameters q, ingredient, scope (mine or shared)               |
| POST   | /recipes                          | Authenticated                       | Create a recipe                                                          |
| GET    | /recipes/{id}                     | Author or recipient                 | Detail                                                                   |
| PUT    | /recipes/{id}                     | Author                              | Update                                                                   |
| DELETE | /recipes/{id}                     | Author                              | Delete                                                                   |
| POST   | /recipes/{id}/copy                | Recipient                           | Copy into your own recipe book                                           |
| GET    | /recipes/{id}/shares              | Author                              | List shares                                                              |
| PUT    | /recipes/{id}/shares              | Author                              | Set the members it is shared with                                        |
| POST   | /recipes/import                   | Authenticated                       | Turn pasted text or a link into a recipe draft (nothing is saved)        |
| GET    | /features                         | Authenticated                       | Optional features available on this server                               |
| GET    | /tags                             | Authenticated                       | Starter and personal tags                                                |
| POST   | /tags                             | Authenticated                       | Create a personal tag                                                    |
| DELETE | /tags/{id}                        | Author of the tag                   | Delete a personal tag                                                    |
| POST   | /photos                           | Authenticated                       | Upload a photo                                                           |
| GET    | /photos/{id}                      | Anyone who can see the linked recipe | Download a photo                                                         |

## 8. Interface

Mobile-first design, with a layout adapted for tablets. Default language: Italian.

Main screens:

- Sign-in and sign-up, with Google sign-in.
- Recipe list, with a search bar, a choice between name and ingredient, and two sections: "Le mie ricette" (my recipes) and "Condivise con me" (shared with me).
- Recipe detail, with servings adjustment, the "Inizia a cucinare" (start cooking) button, sharing (for the author) or copying (for the recipient).
- Recipe editor, with reordering of ingredients and steps and photo upload.
- Cooking mode, full screen.
- Household: members, invitation generation, leaving the household.
- Privacy notice (`/privacy`): public page, linked from the footer of every page and from the sign-in, sign-up, password recovery and invitation pages.

## 9. External integrations

- Google OAuth for sign-in.
- Transactional email service over SMTP for password recovery.
- A language model through an OpenAI-compatible chat completions API (Ollama or any compatible provider), configured with `LLM_BASE_URL`, `LLM_MODEL` and an optional `LLM_API_KEY`. The feature is optional.
- Browser APIs: Screen Wake Lock to keep the screen on, Web Speech API for voice commands, Web Audio or an audio element for the timer alert.

## 10. Non-functional requirements

- Performance: search responds in under 1 second with up to 1,000 recipes per user. Photos are resized on the server (longest side at most 1600 px) and converted to a compressed format, with thumbnails for lists.
- Security: httpOnly, Secure, SameSite=Lax cookies. Sign-in attempts are rate limited. Authorization is checked on every endpoint: a user accesses only their own recipes and the ones shared with them. Photos are served only to those who can see the recipe. Uploads are limited to 10 MB and to common image formats.
- Privacy and GDPR: minimal personal data (email, name, optional Google identifier). Account deletion removes recipes, photos and shares. Simple privacy notice.
- Accessibility: adequate contrast, touch targets of at least 44 px, cooking mode readable from a distance.
- Internationalization: every interface text, the date, list and number formats, and the voice-command phrases live in per-language i18next resources (`apps/frontend/src/i18n`), with Italian as the default language; the chosen language is kept in the browser. The API returns stable error codes with English messages, and the interface translates them from the code. Starter tags have stable keys so their names can be translated. Known limits for now: the password-recovery email, the search stemming, the PWA manifest and the offline page are Italian only.
- Supported browsers and devices: Chrome on Android and Safari on iOS, latest two versions, on phones and tablets. Voice commands and the always-on screen only where the browser supports them.

## 11. Environments and release

- Local: Docker Compose with PostgreSQL, backend and frontend.
- Production: a VPS with Docker Compose. Caddy as reverse proxy with automatic HTTPS, frontend and API on the same domain. PostgreSQL in a container with a persistent volume. Photos on a persistent volume.
- Release: `deploy/deploy.sh` runs on the server and does everything in order (backup, build, migrations, start, smoke test); `docs/DEPLOY.md` is the step-by-step guide.
- Backup: nightly database dump and copy of the photos to storage outside the server, kept for 14 days. Restore tested at least once before using the app with real data.
- Configuration through environment variables, with an up-to-date `.env.example`.

## 12. Open questions

- [x] App name: Bis. To check: availability of the domain, store names and registered trademarks.
- [ ] Should tags also work as a filter in the recipe list, besides being information?
- [x] List of units of measure: fixed (`g`, `kg`, `ml`, `l`, `tablespoon`, `teaspoon`, `cup`, `pinch`, `clove`, `pieces`, shown in Italian as g, kg, ml, l, cucchiaio, cucchiaino, tazza, pizzico, spicchio, pezzi); the unit is optional.
- [ ] Should ingredient search find "zucchine" when typing "zucchina"?
- [ ] Is a way to export your own recipes needed, to avoid depending on the app?
- [ ] Provider for the VPS, for the domain and for the transactional emails.

## Ideas for later versions

- Voice dictation that turns the spoken account of the preparation into a structured recipe.
- A history of the times a recipe was made again, with notes on what changed.
- Importing recipes from photos of the notebook pages.
