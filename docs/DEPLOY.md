# Deploying Bis to production

This guide takes you from an empty Ubuntu 24.04 server to a running Bis, and covers every release after the first, restoring from a backup and what to do when a release goes wrong.

To run Bis on your own Mac behind Tailscale instead of on a server, see [CASA.md](CASA.md).

Everything is run on the server, in a clone of this repository, with Docker Compose. The files involved:

| File | Purpose |
| --- | --- |
| `docker-compose.prod.yml` | Production stack: PostgreSQL, one-shot migration, backend, photo cleaner, Caddy with the compiled frontend, backup |
| `.env.production` | Your settings and secrets on the server (never committed). Start from `.env.production.example` |
| `deploy/Caddyfile` | Reverse proxy, automatic HTTPS and security headers |
| `deploy/deploy.sh` | One-command release and rollback |
| `deploy/compose.sh` | Runs Docker Compose with the production file, settings and current images |
| `deploy/restore.sh` | Lists backups and restores the database and photos |
| `deploy/backup/` | Image and scripts of the nightly backup |

## 1. What you need first

- A VPS with Ubuntu 24.04, at least 2 GB of RAM and 20 GB of disk, with a public IPv4 address.
- A domain name you control. Bis and its API live on the same domain, for example `bis.example.com`.
- An SMTP account to send email (password recovery). Any transactional email provider works.
- A Backblaze B2 account for the backups (section 4). Any S3-compatible storage works the same way.
- Optional: a Google OAuth client, only if you want "Accedi con Google".

At the DNS provider of the domain, create an `A` record pointing to the server's IPv4 address (and an `AAAA` record if the server has IPv6). The email provider will also ask for SPF and DKIM records on the sending domain: add exactly what it shows you, otherwise password-recovery emails may end up in spam.

## 2. Prepare the server

Log in as root with the key your provider installed, then run the commands below.

### 2.1 Update the system

```bash
apt update && apt full-upgrade -y
timedatectl
```

The clock must be synchronized (`System clock synchronized: yes`), because HTTPS certificates depend on it.

### 2.2 Create a non-root user

```bash
adduser --disabled-password --gecos "" deploy
passwd deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

The password you set is used only by `sudo`, never to log in over SSH. From your computer, in a new terminal, check that `ssh deploy@<server-ip>` works and that `sudo -v` succeeds before going on.

### 2.3 SSH with keys only

> **Before you change anything, open a second SSH session and leave it open.** In another terminal on your computer, run `ssh deploy@<server-ip>` and keep that window untouched until the checks at the end of this section pass. If the new SSH settings turn out to lock you out, that session is still connected and lets you undo the change. Without it, the only way back in may be the provider's rescue console. The same applies to the firewall (2.4) and to fail2ban (2.5).

As `deploy`, in your first session:

```bash
sudo tee /etc/ssh/sshd_config.d/01-hardening.conf >/dev/null <<'CONF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
CONF
sudo sshd -t
sudo systemctl restart ssh
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication) '
```

The file name starts with `01` on purpose: sshd keeps the first value it reads, and some providers ship a `50-cloud-init.conf` that re-enables passwords.

Check the result:

1. The last command must print `permitrootlogin no` and `passwordauthentication no`. If `sshd -t` printed an error, do not restart SSH: fix the file first.
2. Open a third terminal and run `ssh deploy@<server-ip>`: you must get in with your key, without a password prompt.
3. In that terminal run `ssh root@<server-ip>`: it must be refused with `Permission denied`.

Only when both checks pass, close the spare session.

### 2.4 Firewall

Keep the spare SSH session from 2.3 open. The firewall must allow SSH before it is switched on, which is why `ufw allow OpenSSH` comes before `ufw enable`. `ufw enable` warns that it may disrupt existing SSH connections: answer `y`.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
sudo ufw status verbose
```

Check that `ufw status verbose` says `Status: active`, that the default is `deny (incoming)`, and that 22, 80 and 443 are listed. From your computer, `ssh deploy@<server-ip>` must still work.

Port 80 is needed for the certificate challenge and the redirect to HTTPS, 443 (TCP and UDP) for the app and HTTP/3. The production compose file publishes no other port: PostgreSQL and the backend are reachable only inside the Docker network. Docker writes its own firewall rules for published ports, which is why this file must never publish more.

### 2.5 Block repeated login attempts (fail2ban)

Anyone can try to log in to a server that is reachable from the Internet, and the logs fill up with failed attempts. Because passwords are already disabled (2.3), those attempts cannot succeed, but fail2ban still watches the SSH log and blocks an address for one hour after 5 failed attempts in 10 minutes. This reduces noise and load. It protects only SSH: ports 80 and 443 are served by Caddy.

Keep the spare SSH session open. As `deploy`:

```bash
sudo apt install -y fail2ban
sudo tee /etc/fail2ban/jail.d/bis-sshd.local >/dev/null <<'CONF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
CONF
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
sudo systemctl is-active fail2ban
sudo fail2ban-client status sshd
```

`is-active` must print `active`, and the last command must show `Status for the jail: sshd` with a `Currently banned` counter. If it says that the `sshd` jail does not exist, look at `sudo journalctl -u fail2ban -n 30`.

If you ever ban yourself by mistake (for example after many wrong attempts), log in from another network or the provider's console and run `sudo fail2ban-client set sshd unbanip <your-ip>`.

### 2.6 Automatic security updates

```bash
sudo apt install -y unattended-upgrades
sudo tee /etc/apt/apt.conf.d/20auto-upgrades >/dev/null <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF
sudo tee /etc/apt/apt.conf.d/52bis-reboot >/dev/null <<'CONF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
CONF
sudo unattended-upgrade --dry-run --debug 2>&1 | tail -5
```

Kernel updates then take effect with a reboot at 04:30 server time, after the nightly backup. Every container has `restart: unless-stopped`, so the stack comes back by itself.

### 2.7 Install Docker

```bash
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
```

Log out and back in so the group applies, then check `docker run --rm hello-world`. Membership of the `docker` group is equivalent to root on this machine: that is acceptable for a server that exists only for Bis, and it is the reason SSH is limited to keys.

As a second safety net for logs, set the same limits as the compose file for every container on the host:

```bash
sudo tee /etc/docker/daemon.json >/dev/null <<'CONF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
CONF
sudo systemctl restart docker
```

## 3. Prepare the backup storage (Backblaze B2)

Backups are encrypted on the server by restic before they leave it, so the storage provider never sees your data.

1. Create a private bucket, for example `bis-backups`. Leave Object Lock off (restic must be able to delete old snapshots).
2. Under Application Keys, create a key restricted to that bucket with read and write access. Write down the `keyID` and the `applicationKey`: the second is shown only once.
3. In the bucket details, note the S3 endpoint, for example `s3.eu-central-003.backblazeb2.com`.
4. Generate the repository password with `openssl rand -base64 32` and store it in a password manager, outside the server. Without it the backups cannot be read.
5. Optional: create a check on a monitoring service that supports ping URLs (for example healthchecks.io) and note its URL. Bis calls it at the start and end of every backup, and at `/fail` on errors, so a silent failure sends you an alert.

## 4. First release

As `deploy`:

```bash
sudo install -d -o deploy -g deploy /opt/bis
git clone <repository-url> /opt/bis
cd /opt/bis
cp .env.production.example .env.production
chmod 600 .env.production
```

If the repository is private, first create a read-only deploy key with `ssh-keygen -t ed25519 -f ~/.ssh/bis_deploy`, add the public key to the repository settings, and clone with it.

Edit `.env.production` (`nano .env.production`). Generate each secret with `openssl rand -hex 24`: hexadecimal avoids characters that break the database URL.

| Variable | Value |
| --- | --- |
| `DOMAIN` | The domain, without `https://` |
| `ACME_EMAIL` | Email for certificate expiry notices |
| `POSTGRES_USER`, `POSTGRES_DB` | Names of your choice, for example `bis` |
| `POSTGRES_PASSWORD` | A generated secret (hexadecimal) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY` | From the email provider. `SMTP_SECURITY` is `starttls` (port 587), `ssl` (port 465) or `none` |
| `SMTP_USER`, `SMTP_PASSWORD` | From the email provider |
| `SMTP_FROM` | Sender address on the domain you authenticated, for example `Bis <noreply@bis.example.com>` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Leave empty to disable Google sign-in. Otherwise register `https://<DOMAIN>/api/auth/google/callback` as an authorized redirect URI in the Google console |
| `RESTIC_REPOSITORY` | `s3:https://<endpoint>/<bucket>` from section 3 |
| `RESTIC_PASSWORD` | The repository password from section 3 |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | The `keyID` and `applicationKey` of the Backblaze key |
| `BACKUP_HOUR_UTC` | Hour of the nightly backup in UTC, integer from 0 to 23 without a leading zero (default 3) |
| `BACKUP_PING_URL` | Optional monitoring URL |

The release script refuses to run while any `change-me` placeholder is left, or if the file is readable by other users.

Check that the domain points to this server, then release:

```bash
dig +short "$(grep ^DOMAIN= .env.production | cut -d= -f2)"
./deploy/deploy.sh
```

The first run builds the images (several minutes), takes an initial backup, applies the migrations, starts everything and waits until every service is healthy. Caddy requests the certificate on the first start, so the final smoke test may need up to a minute. At the end it prints `Release <id> is live.`

If the backup storage is not ready yet, `./deploy/deploy.sh --skip-backup` skips the pre-release backup. Use it only for this first release, and fix the storage before putting real data in.

Then verify from your computer and your phone:

1. Open `https://<DOMAIN>`: the sign-in page loads over HTTPS and shows the "Informativa sulla privacy" link.
2. Sign up: the first account becomes the owner of a new household.
3. Use "Password dimenticata" and check that the email arrives (and does not land in spam).
4. Check the headers: `curl -sI https://<DOMAIN>/ | grep -iE 'strict-transport|content-security|x-content-type|referrer'`.
5. Add the app to the home screen of your phone.

## 5. Everyday commands

`deploy/compose.sh` runs Docker Compose with the production file, your `.env.production` and the images of the running release, so you never type those options. Run it from any folder on the server, for example `/opt/bis/deploy/compose.sh ps`. The examples below assume you are in `/opt/bis`.

| Task | Command |
| --- | --- |
| State and health of every service | `./deploy/compose.sh ps` |
| Follow the logs of a service | `./deploy/compose.sh logs -f --tail 100 backend` |
| Open the database shell | `./deploy/compose.sh exec db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'` |
| Stop everything (data is kept) | `./deploy/compose.sh down` |

Never run `./deploy/compose.sh down -v`: it deletes the volumes that hold the database and the photos.

## 6. Later releases

1. Merge the change to the main branch, and check that CI passes.
2. On the server:

```bash
cd /opt/bis
./deploy/deploy.sh
```

The script, in order:

1. Checks `.env.production` and that the working tree is clean.
2. Pulls the main branch with a fast-forward only.
3. Builds the new images, tagged with the commit hash. Nothing running is touched yet: if a build or a type check fails, the release stops here.
4. Takes a backup tagged `pre-release` (database and photos).
5. Runs the Alembic migrations in a one-shot container, before the new backend exists. If a migration fails, the running app is untouched and the database is unchanged (each migration runs in a transaction).
6. Starts the new containers and waits for their health checks.
7. Calls `https://<DOMAIN>/api/health` and the home page.
8. Records the release and removes images older than the previous release.

The app restarts for a few seconds during step 6. Between steps 5 and 6 the old backend runs against the new schema, so write migrations that the previous version of the code tolerates (add nullable columns instead of renaming, drop in a later release what is no longer used).

## 7. Backups

- Every night at `BACKUP_HOUR_UTC`, the `backup` service dumps the database, copies the photos and uploads both, encrypted and deduplicated, to the storage. It then deletes snapshots older than 14 days and verifies the repository.
- Check that it is alive and that the last run succeeded: `./deploy/compose.sh ps backup` must say `healthy`. It becomes `unhealthy` after a failed run, and `./deploy/compose.sh logs backup` shows why.
- List what is stored: `./deploy/restore.sh list`.
- Run one by hand: `./deploy/compose.sh run --rm backup /usr/local/bin/backup.sh manual`.

## 8. Restore from a backup

The restore replaces the current database and photos with a backup. It stops the app for its duration.

On the same server:

```bash
cd /opt/bis
./deploy/restore.sh list
./deploy/restore.sh run
```

`run` restores the most recent database snapshot and the most recent photos snapshot after you type `restore`. To pick older ones, pass the snapshot ids shown by `list`, database first: `./deploy/restore.sh run <db-snapshot> <photos-snapshot>`. After the restore the script applies any pending migration, restarts the app and runs the smoke test.

On a new server (the old one is lost):

1. Do sections 2 to 4 with the same `.env.production` values, in particular the same `RESTIC_REPOSITORY` and `RESTIC_PASSWORD`.
2. Run `./deploy/deploy.sh --skip-backup` to get an empty working stack. The empty database must not overwrite the real backups: the nightly job only adds new snapshots, so run the restore before the first night.
3. Run `./deploy/restore.sh run`.
4. Point the DNS record to the new server if it changed.

**Test the restore once before using Bis with real data.** A backup that was never restored is only a hope. A good drill:

1. Create an account, a recipe with a photo.
2. Take a manual backup (section 7).
3. Delete the recipe from the app.
4. Run `./deploy/restore.sh run` and check that the account, the recipe and the photo are back.

## 9. When a release goes wrong

The script says at which step it stopped.

| Where it stopped | What it means | What to do |
| --- | --- | --- |
| Pull, build | The running app is untouched | Fix the problem in the code and release again |
| Backup | The running app is untouched | Check the storage variables and `./deploy/compose.sh logs backup`. Do not skip the backup for a normal release |
| Migrate | The running app is untouched and the database unchanged | Read the error, fix the migration with a new commit, release again. Never edit a migration already applied |
| Start or smoke test | The new version is running but unhealthy | See below |

When the new version is unhealthy:

1. Look at the logs: `./deploy/compose.sh ps`, then `./deploy/compose.sh logs --tail 100 backend` (and `caddy`).
2. If it is a code problem, go back to the previous images:

```bash
./deploy/deploy.sh --rollback
```

   This restarts the previous release's images without running migrations.
3. If the failed release also applied migrations, the previous code may not work with the new schema. Restore the database taken before the release, which is the latest snapshot: `./deploy/restore.sh run`. Note that this also discards what users saved since that backup.
4. Fix the problem in a new commit and release again.

If a deploy is interrupted and says another release is running, check that no `deploy.sh` is running (`pgrep -f deploy.sh`) and remove the stale lock with `rmdir /opt/bis/.deploy/lock`.

## 10. Maintenance

- **Logs** rotate by themselves: 10 MB per file, 5 files per container.
- **Disk**: `docker system df` and `df -h`. The release script already removes old images.
- **Certificates** renew automatically through Caddy. Port 80 must stay open.
- **Base images** (Python, Node, PostgreSQL, Caddy, restic) are pinned to exact versions in the Dockerfiles and the compose file. To update one, change the version in a commit, run the CI, release. PostgreSQL major upgrades need a dump and restore: do not change the major version in place.
- **Operating system** security updates are automatic (section 2.6). Run `sudo apt update && sudo apt upgrade` now and then for the rest.
- **Privacy notice**: the page is in `apps/frontend/src/i18n/it/privacy.json`. When the hosting, email and storage providers are chosen, check that it describes them and, if any is outside the European Union, add the transfer safeguards.

## 11. What was not tested on a real server

The stack, the migration order, the health checks, the security headers and the backup and restore cycle were exercised locally with a self-signed certificate and a local restic repository. Not exercised before the first real release: the automatic certificate from a public CA, the SSH, firewall and fail2ban steps, Backblaze B2 itself, sending real email and Google sign-in on the real domain.
