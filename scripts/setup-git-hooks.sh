#!/bin/sh
set -e

REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
cd "$REPOSITORY_ROOT"

git config --local core.hooksPath .githooks
chmod +x .githooks/*

echo "Git hooks configured: .githooks"
