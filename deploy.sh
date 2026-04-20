#!/usr/bin/env bash
# Deploy NetDocs på Docker.
# Henter siste kode, bygger på nytt og restartar containerane.
# Workaround for docker-compose v1.29.2 sin "KeyError: 'ContainerConfig'"-bug:
# vi fjernar gamle containerar manuelt før `up`. Volumet `pgdata` blir behaldt,
# så databasen overlever.

set -euo pipefail

PROJECT_LABEL="com.docker.compose.project=home-network-hub"

echo "▶ git pull origin main"
git pull origin main

echo "▶ docker-compose build --no-cache"
docker-compose build --no-cache

echo "▶ Fjerner gamle containerar (volum behaldt)"
docker ps -aq --filter "label=${PROJECT_LABEL}" | xargs -r docker rm -f

echo "▶ docker-compose up -d"
docker-compose up -d

echo "✓ Ferdig. Sjekk status med: docker-compose ps"
