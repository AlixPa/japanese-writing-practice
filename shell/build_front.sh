#!/bin/sh

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

cd frontend || { echo "Frontend folder not found"; exit 1; }
bun install
bun run build