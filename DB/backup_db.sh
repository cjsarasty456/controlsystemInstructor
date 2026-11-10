#!/bin/bash
set -e

# ============================================================
# SCRIPT DE RESPALDO DE BASE DE DATOS — SENA CIES HUILA
# Guarda copia nativa en 05_Administracion_Documental/05_Respaldos_y_Recuperacion
# ============================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/carlos/trabajo-instructor/05_Administracion_Documental/05_Respaldos_y_Recuperacion"
BACKUP_FILE="${BACKUP_DIR}/backup_controlsystem_SENA_${TIMESTAMP}.sql"
BACKUP_GZ="${BACKUP_FILE}.gz"

mkdir -p "$BACKUP_DIR"

echo "=== INICIANDO COPIA DE SEGURIDAD POSTGRESQL ==="
echo "Fecha y hora: $(date)"
echo "Base de datos: controlsystem_db"

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-controlsystem_db}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD}}"

if [ -z "$PGPASSWORD" ]; then
    echo "ERROR: Debe definir la variable PGPASSWORD o POSTGRES_PASSWORD"
    exit 1
fi

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"

gzip -k -f "$BACKUP_FILE"

echo "✓ Respaldo generado con éxito:"
ls -lh "$BACKUP_FILE" "$BACKUP_GZ"
echo "=== COPIA DE SEGURIDAD COMPLETADA EXITOSAMENTE ==="

