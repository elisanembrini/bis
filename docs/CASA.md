# Running Bis at home on a Mac

This guide runs Bis on your own Mac, for free, reachable only from your own devices through Tailscale. It reuses the production stack described in [DEPLOY.md](DEPLOY.md) and changes three things:

- Caddy serves plain HTTP on `127.0.0.1` only. It requests no certificate, because `tailscale serve` provides the HTTPS.
- The public address of the app is the `ts.net` name of your Mac. Cookies stay `Secure`, and the email links and the Google callback use that same `https://` address.
- The nightly encrypted backup (restic) goes to a folder on the Mac instead of Backblaze.

Nothing is exposed to the internet and nothing is exposed to your home network: the only published port is `127.0.0.1:8080`, and `deploy/casa.sh` refuses to start if any published port is not bound to `127.0.0.1`. Never use `tailscale funnel`, which publishes a service to the whole internet. This guide only uses `tailscale serve`, which shares inside your tailnet.

The production setup for a server stays valid and untouched.

## 0. What to expect

- Bis is available only while the Mac is on, awake and logged in, with Docker Desktop and Tailscale running.
- A backup in a folder on the same disk does not protect you from losing that disk. Section 7 explains how to keep a second copy.

| File | Purpose |
| --- | --- |
| `docker-compose.casa.yml`, `docker-compose.casa.ports.yml` | Overrides of `docker-compose.prod.yml`: Caddyfile for HTTP, port on loopback only, backup folder |
| `deploy/Caddyfile.casa` | Caddy without certificates, serving HTTP on port 80 inside the container |
| `deploy/Caddyfile.site` | Routes, security headers and cache rules, shared with the production `deploy/Caddyfile` |
| `.env.casa` | Your settings and secrets (never committed). Start from `.env.casa.example` |
| `deploy/casa.sh` | Wrapper of `deploy.sh`, `restore.sh` and `compose.sh` for this profile |

## 1. Install Tailscale on the Mac and on the phone

1. Install Tailscale on the Mac and sign in. Tailscale offers more than one macOS variant: install only one of them ([macOS variants](https://tailscale.com/docs/concepts/macos-variants)).
2. Install the Tailscale app on the phone and sign in with the same account.
3. Install the command line tool, which you need in section 5. With the standalone variant, enable it from the client settings: it creates `/usr/local/bin/tailscale`. With the App Store variant the tool is inside the app: run it as `/Applications/Tailscale.app/Contents/MacOS/Tailscale`, or add `alias tailscale="/Applications/Tailscale.app/Contents/MacOS/Tailscale"` to `~/.zshrc` ([Tailscale CLI](https://tailscale.com/kb/1080/cli?tab=macos)).
4. Check that the Mac and the phone appear connected in the Tailscale app.

## 2. Enable MagicDNS and HTTPS in the Tailscale console

In the [admin console](https://login.tailscale.com/admin/dns), open the DNS page, make sure MagicDNS is on, and under HTTPS Certificates select Enable HTTPS ([Enabling HTTPS](https://tailscale.com/docs/how-to/set-up-https-certificates)).

Note the full name of the Mac, which looks like `my-mac.tailnet-name.ts.net`. It is shown on the Machines page and by `tailscale status`. This is your `DOMAIN`.

## 3. Prepare the settings

From the folder of the repository:

```bash
cp .env.casa.example .env.casa
chmod 600 .env.casa
```

Edit `.env.casa` (`nano .env.casa`). Generate each secret with `openssl rand -hex 24`.

| Variable | Value |
| --- | --- |
| `DOMAIN` | The `ts.net` name of the Mac, without `https://` |
| `ACME_EMAIL` | Leave as is: required by the production file, unused here |
| `POSTGRES_USER`, `POSTGRES_DB` | Names of your choice, for example `bis` |
| `POSTGRES_PASSWORD` | A generated secret |
| `SMTP_*` | An SMTP account for the password-recovery email, see below |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Leave empty to disable Google sign-in (section 6) |
| `BACKUP_DIR` | Absolute path of the backup folder on the Mac, for example `/Users/<you>/BisBackup`. It is created if missing |
| `RESTIC_REPOSITORY` | Leave `/backup/repo`: it is the folder above, as seen from the container |
| `RESTIC_PASSWORD` | A generated secret. **Store it in a password manager, outside this Mac.** Without it the backups cannot be read |
| `BACKUP_HOUR_UTC` | Hour of the nightly backup in UTC, integer from 0 to 23 without a leading zero |
| `BACKUP_PING_URL` | Optional monitoring URL |

The script refuses to run while any `change-me` placeholder is left, or if the file is readable by other users.

**Email.** With a Gmail account the settings are `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURITY=starttls`, `SMTP_USER` your full address and `SMTP_PASSWORD` an app password, not your normal password. App passwords need 2-Step Verification turned on in your Google account. The Gmail settings come from third-party guides, not from Google's own pages: check them against your account ([Nylas: Gmail SMTP settings](https://developer.nylas.com/docs/cookbook/email/gmail-smtp-settings/)). `SMTP_FROM` should use the same address, for example `Bis <you@gmail.com>`.

## 4. Start the app

Open Docker Desktop and wait until it is running, then:

```bash
./deploy/casa.sh deploy
```

The first run builds the images (several minutes), takes an initial backup into `BACKUP_DIR`, applies the migrations, starts everything and checks `http://127.0.0.1:8080`. At the end it prints `Release <id> is live.`

At this point the app answers only on the Mac itself, over plain HTTP. Sign-in will not work from `http://127.0.0.1:8080` in every browser, because the session cookie is `Secure`: test it through the HTTPS address of the next step.

## 5. Share it with your devices

```bash
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

With `--bg` the configuration keeps running in the background and resumes after a reboot or after `tailscale down` and `tailscale up` ([tailscale serve](https://tailscale.com/docs/reference/tailscale-cli/serve)). If HTTPS or MagicDNS is not enabled yet, the command prints a `login.tailscale.com` link and waits: complete section 2 there.

Check:

```bash
tailscale serve status
tailscale funnel status
```

`serve status` must show `https://<DOMAIN>` proxying to `http://127.0.0.1:8080` and marked as tailnet only. `funnel status` must show nothing enabled. To stop sharing: `tailscale serve --https=443 off`, or `tailscale serve reset` to clear everything.

Then, on the phone with Tailscale connected, open `https://<DOMAIN>`: the sign-in page loads with a valid certificate. Sign up (the first account owns the household), use "Password dimenticata" to check the email, and add the app to the home screen.

## 6. Update the Google redirect URI

Only if you want "Accedi con Google". In the Google Cloud console, open APIs & Services, Credentials, the OAuth client of Bis, and under Authorized redirect URIs add:

```
https://<DOMAIN>/api/auth/google/callback
```

Save. Changes can take from a few minutes to a few hours to apply ([Manage OAuth Clients](https://support.google.com/cloud/answer/6158849)). Keep the URIs that were already there until the new one works, so you can go back. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.casa` and run `./deploy/casa.sh deploy --no-pull` again.

If Google rejects the `ts.net` address, you cannot use Google sign-in with this setup: this was not tested, because it needs your Google project.

## 7. Keep the Mac available

1. **Docker Desktop** must start by itself: in its settings, General, turn on "Start Docker Desktop when you sign in". All containers have `restart: unless-stopped`, so they come back with it. This happens at login, so after a reboot Bis returns only once you have logged in.
2. **Sleep.** While the Mac sleeps Bis is unreachable. To stop the Mac from sleeping when it is on the power adapter, use System Settings, Battery, Options, "Prevent automatic sleeping on power adapter when the display is off". The equivalent in the terminal is `sudo pmset -c sleep 0`, and `pmset -g` shows the active values ([pmset reference](https://www.sudo.is/docs/macos/man_pmset.html)). On a Mac without a battery, use `sudo pmset sleep 0`. On a laptop, the behavior with the lid closed was not checked: leave the lid open or use a Mac that is always plugged in.
3. **Backups and sleep.** The nightly job starts at `BACKUP_HOUR_UTC`. By reading `deploy/backup/scheduler.sh`, a Mac asleep at that hour runs the backup as soon as it wakes. This was not exercised.
4. **A second copy of the backup.** The folder holds an encrypted restic repository. Copy it now and then to an external disk or a synchronized folder, for example `rsync -a --delete "$BACKUP_DIR/repo/" /Volumes/<disk>/BisBackup/repo/` (replace the paths). Without a copy outside this Mac, a lost or broken disk loses the app and its backups together.

## 8. Everyday commands

Run them from the repository.

| Task | Command |
| --- | --- |
| Release a new version (pull, build, backup, migrate, start) | `./deploy/casa.sh deploy` |
| Go back to the previous images | `./deploy/casa.sh deploy --rollback` |
| State and health of every service | `./deploy/casa.sh compose ps` |
| Follow the logs of a service | `./deploy/casa.sh compose logs -f --tail 100 backend` |
| Stop everything (data is kept) | `./deploy/casa.sh compose down` |

Never run `./deploy/casa.sh compose down -v`: it deletes the volumes that hold the database and the photos.

A release restarts the app for a few seconds. The steps, the rollback rules and what to do when a release fails are the same as in sections 6 and 9 of [DEPLOY.md](DEPLOY.md): replace `./deploy/deploy.sh` with `./deploy/casa.sh deploy` and `./deploy/restore.sh` with `./deploy/casa.sh restore`.

## 9. Backups and restore

Every night the `backup` service dumps the database, copies the photos and stores both, encrypted, in `BACKUP_DIR/repo`. It then deletes snapshots older than 14 days and verifies the repository.

| Task | Command |
| --- | --- |
| Is the last run fine? | `./deploy/casa.sh compose ps backup` must say `healthy` |
| List the snapshots | `./deploy/casa.sh restore list` |
| Run a backup now | `./deploy/casa.sh compose run --rm backup /usr/local/bin/backup.sh manual` |
| Restore the latest backup | `./deploy/casa.sh restore run` |
| Restore older snapshots | `./deploy/casa.sh restore run <db-snapshot> <photos-snapshot>` |

`restore run` replaces the current database and photos with the backup, after you type `restore`. It stops the app for its duration, applies any pending migration, restarts it and runs the smoke test.

**On a new Mac, or after losing this one:** install Docker Desktop and Tailscale, clone the repository, copy back your `.env.casa` with the same `RESTIC_PASSWORD`, put the backup folder at the `BACKUP_DIR` path, then run `./deploy/casa.sh deploy --skip-backup` followed by `./deploy/casa.sh restore run`, and `tailscale serve` again. A new Mac has a new `ts.net` name unless you reuse the old machine name: change `DOMAIN` and the Google URI accordingly.

**Test the restore once before using real data**: create an account and a recipe with a photo, run a manual backup, delete the recipe, run `./deploy/casa.sh restore run` and check that the account, the recipe and the photo are back.

## 10. What was and was not tested

Tested on a Mac with Docker Desktop (Compose 2.24.3), with a test `.env.casa`, a test backup folder and no Tailscale:

- A full release with `casa.sh`, including the pre-release backup into the Mac folder, the migrations, the health checks and the smoke test on `http://127.0.0.1:8080`.
- Only `127.0.0.1:8080` is published, and from the Mac's own LAN address ports 80 and 8080 do not answer. Caddy sends the same security headers as in production.
- `casa.sh` refuses to start when a published port is not on `127.0.0.1`.
- Backup and restore through the Mac folder: after deleting the recipe and the photo files, `restore run` brought back the login, the recipe and the photo with the same checksum.
- Compose 2.24.3 ignores the `!override` tag without a warning, which is why the ports come from two files (`!reset`, then the loopback port). Docker's documentation lists `!override` from Compose 2.24.4.

Not tested, because they need your accounts or time:

- `tailscale serve` itself and the `ts.net` certificate, the Tailscale console steps, and the phone.
- Whether the session cookie works end to end over the `ts.net` HTTPS address. In production this relies on `Secure` cookies behind HTTPS, which `tailscale serve` provides.
- The Google redirect URI, real email through Gmail, and sleep and wake behavior of the Mac over days.
