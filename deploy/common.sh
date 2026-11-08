#!/usr/bin/env bash

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root" || exit 1

env_file="${ENV_FILE:-.env.production}"
state_dir=".deploy"
compose_file="docker-compose.prod.yml"

compose() {
  local files=(-f "$compose_file")
  local overrides override
  read -ra overrides <<<"${COMPOSE_OVERRIDE:-}"
  for override in "${overrides[@]}"; do
    files+=(-f "$override")
  done
  docker compose --env-file "$env_file" "${files[@]}" "$@"
}

require_env_file() {
  if [ ! -f "$env_file" ]; then
    echo "Missing $env_file. Copy .env.production.example and fill it in." >&2
    exit 1
  fi
  local mode
  mode="$(stat -c %a "$env_file" 2>/dev/null || stat -f %Lp "$env_file")"
  if [ "${mode: -2}" != "00" ]; then
    echo "$env_file must be readable only by its owner: run chmod 600 $env_file" >&2
    exit 1
  fi
  if grep -q 'change-me' "$env_file"; then
    echo "$env_file still contains change-me placeholders." >&2
    exit 1
  fi
}

env_value() {
  grep -E "^$1=" "$env_file" | head -n 1 | cut -d= -f2-
}

current_tag() {
  if [ -f "$state_dir/current" ]; then
    cat "$state_dir/current"
  fi
}

smoke_test() {
  local domain url curl_args
  domain="$(env_value DOMAIN)"
  url="${SMOKE_URL:-https://$domain}"
  curl_args=(-fsS)
  if [ -n "${SMOKE_INSECURE:-}" ]; then
    curl_args+=(-k)
  fi
  for _ in $(seq 1 30); do
    if curl "${curl_args[@]}" "$url/api/health" 2>/dev/null | grep -q '"status":"ok"' \
      && curl "${curl_args[@]}" -o /dev/null "$url/" 2>/dev/null; then
      echo "Smoke test passed at $url"
      return 0
    fi
    sleep 2
  done
  echo "Smoke test failed at $url" >&2
  return 1
}
