#!/bin/bash
set -e

echo "Configurando PostgreSQL..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Crear base de datos si no existe
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw controlsystem_db; then
    sudo -u postgres psql -c "CREATE DATABASE controlsystem_db OWNER postgres;"
    echo "Base de datos controlsystem_db creada."
else
    echo "Base de datos controlsystem_db ya existía."
fi

# Ejecutar esquema pasando por stdin para evitar problemas de permisos de /home/carlos
echo "Aplicando esquema DDL..."
cat /home/carlos/trabajo-instructor/04_Aplicativos_y_Automatizacion/06_Aplicativos_Internos/controlsystemInstructor/DB/schema.sql | sudo -u postgres psql -d controlsystem_db

echo "Verificando tablas creadas:"
sudo -u postgres psql -d controlsystem_db -c "\dt"

echo "PostgreSQL configurado exitosamente."
