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

export PGPASSWORD="postgres"
pg_dump -h localhost -U postgres -d controlsystem_db --clean --if-exists > "$BACKUP_FILE"

gzip -k -f "$BACKUP_FILE"

echo "✓ Respaldo generado con éxito:"
ls -lh "$BACKUP_FILE" "$BACKUP_GZ"
echo "=== COPIA DE SEGURIDAD COMPLETADA EXITOSAMENTE ==="
