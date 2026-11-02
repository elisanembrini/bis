#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
source ./common.sh

require_env_file

IMAGE_TAG="$(current_tag)"
export IMAGE_TAG

compose "$@"
