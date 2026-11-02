# Sistema de Control de Instructores

## Descripción
Sistema web diseñado para la gestión y control de instructores, permitiendo el registro, seguimiento y administración de la información relacionada con el personal docente.

## Estructura del Proyecto

| Carpeta | Descripción |
|---------|-------------|
| `doc/` | Documentación del proyecto e Historias de Usuario |
| `front-end/` | Interfaz de usuario y lógica del cliente (React Native) |
| `back-end/` | Servidor, API y lógica del negocio (Spring Boot) |
| `DB/` | Scripts y configuración de base de datos (PostgreSQL) |

## Funcionalidades

- **Gestión y consulta de fichas:** Registro, consulta, filtrado dinámico y administración de fichas de formación SENA.
- **Reportes de juicios evaluativos:** Sección para adjuntar, categorizar, procesar y descargar reportes de juicios oficiales (Excel, CSV, PDF) por ficha y período/corte.
- **Registro de trabajos:** Control y registro de las actividades y trabajos asignados a los aprendices.
- **Gestión de evidencias:** Almacenamiento y administración de evidencias de aprendizaje (fotos, documentos, archivos).
- **Llamado de asistencia:** Registro y control de la asistencia de los aprendices a las sesiones de formación.
- **Control académico SENA:** Registro del control académico conforme a los lineamientos del Servicio Nacional de Aprendizaje (SENA).
- **Reporte de Proyecto Formativo (HU-009):** Carga y gestión de la planeación pedagógica y proyecto formativo (formatos GPFI-F-134 y GFPI-F-016), garantizando la organización fidedigna de competencias y RAPs en las 4 Fases (Análisis, Planeación, Ejecución, Evaluación).
- **Evaluador Normativo con Reglamento del Aprendiz (HU-005):** Carga del reglamento oficial (Acuerdo 007 de 2012 / Versión Vigente), detección automática de aprendices en riesgo, tipificación de faltas (Leves, Graves, Gravísimas) y generación de citaciones formales a Comité de Evaluación y Seguimiento.
- **Asistente IA para el reglamento (HU-006):** Chat interactivo y consultas semánticas con citas de artículos normativos.

## Tecnologías

- **Front-end:** React JS (Vite + React 18)
- **Back-end:** Spring Boot (Java)
- **Base de datos:** PostgreSQL

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/cjsarasty456/controlsystemInstructor.git
   ```
2. Seguir las instrucciones de configuración en cada carpeta correspondiente.

## Autor
**Carlos Julio Cadena Sarasty** - cjsarasty@gmail.com
