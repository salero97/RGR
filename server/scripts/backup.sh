#!/bin/bash
set -e

CONTAINER_NAME=$(docker ps -qf "name=db")
DB_USER="${POSTGRES_USER:-admin}"
DB_NAME="${POSTGRES_DB:-fire_safety_laba4}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fire_safety_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

if [ -z "$CONTAINER_NAME" ]; then
  echo "Контейнер с базой данных не найден. Убедитесь, что docker-compose up выполнен."
  exit 1
fi

docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

echo "Резервная копия сохранена: $BACKUP_FILE"

find "$BACKUP_DIR" -name "fire_safety_*.sql" -mtime +14 -delete

echo "Старые копии (старше 14 дней) удалены."