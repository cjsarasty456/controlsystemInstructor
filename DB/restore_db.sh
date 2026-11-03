#!/bin/bash
set -e

# ============================================================
# SCRIPT DE RESTAURACIÓN DE BASE DE DATOS — SENA CIES HUILA
# ============================================================

if [ -z "$1" ]; then
    echo "Uso: $0 <archivo_respaldo.sql | archivo_respaldo.sql.gz>"
    echo "Ejemplo: $0 /home/carlos/trabajo-instructor/05_Administracion_Documental/05_Respaldos_y_Recuperacion/backup_controlsystem_SENA_20261102.sql"
    exit 1
fi

RESTORE_FILE="$1"

if [ ! -f "$RESTORE_FILE" ]; then
    echo "ERROR: El archivo '$RESTORE_FILE' no existe."
    exit 1
fi

echo "=== INICIANDO RESTAURACIÓN DE BASE DE DATOS ==="
echo "Archivo: $RESTORE_FILE"
echo "Base de datos destino: controlsystem_db"

export PGPASSWORD="postgres"

if [[ "$RESTORE_FILE" == *.gz ]]; then
    echo "Descomprimiendo y restaurando..."
    gunzip -c "$RESTORE_FILE" | psql -h localhost -U postgres -d controlsystem_db
else
    echo "Restaurando SQL..."
    psql -h localhost -U postgres -d controlsystem_db -f "$RESTORE_FILE"
fi

echo "=== RESTAURACIÓN COMPLETADA EXITOSAMENTE ==="
psql -h localhost -U postgres -d controlsystem_db -c "SELECT count(*) AS total_fichas FROM fichas;"
psql -h localhost -U postgres -d controlsystem_db -c "SELECT count(*) AS total_aprendices FROM aprendices;"
psql -h localhost -U postgres -d controlsystem_db -c "SELECT count(*) AS total_juicios FROM juicios_evaluativos_detalle;"

