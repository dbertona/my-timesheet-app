#!/usr/bin/env bash
set -euo pipefail

# Variables (puedes sobreescribirlas con variables de entorno)
DEPLOY_USER="${DEPLOY_USER:-dbertona}"
DEPLOY_HOST="${DEPLOY_HOST:-192.168.88.68}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-~/timesheet}"
DEPLOY_COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.yml}"

ssh -p "$DEPLOY_PORT" "${DEPLOY_USER}@${DEPLOY_HOST}" "set -e; \
  cd ${DEPLOY_DIR}; \
  git reset --hard HEAD; \
  git clean -fd; \
  git pull --rebase; \
  docker compose -f ${DEPLOY_COMPOSE_FILE} build; \
  docker compose -f ${DEPLOY_COMPOSE_FILE} up -d; \
  docker compose -f ${DEPLOY_COMPOSE_FILE} ps | cat"

echo "Despliegue completado en ${DEPLOY_HOST}:${DEPLOY_DIR}"
