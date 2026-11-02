# HU-009: Carga de Reporte del Proyecto Formativo y Mapeo Curricular de Fases

## Historia de Usuario
**Como** instructor técnico del SENA,  
**Quiero** cargar el Reporte del Proyecto Formativo oficial (formato SOFIA Plus GFPI-F-016 o Planeación Pedagógica GPFI-F-134 en formato PDF o Excel),  
**Para** que la clasificación y el filtrado por fases (Análisis, Planeación, Ejecución, Evaluación) y actividades de proyecto se organicen de manera 100% fidedigna y dinámica de acuerdo con la estructura curricular de cada ficha, sin depender de asociaciones rígidas o estimaciones genéricas.

---

## Criterios de Aceptación

### CA-01: Carga de Archivos de Reporte de Proyecto
* El sistema permite adjuntar el archivo oficial del Proyecto Formativo en formatos `.xlsx`, `.xls`, `.pdf` o `.json`.
* Reconoce los formatos institucionales SENA:
  * **Formato GPFI-F-134:** Planeación Pedagógica del Proyecto Formativo (Excel con columnas: Fase, Actividad de Proyecto, Competencia, Resultado de Aprendizaje).
  * **Formato GFPI-F-016:** Reporte del Proyecto Formativo de SOFIA Plus (PDF con información básica, código de proyecto ej. `2417180`, duración y matriz de 4 fases).
* Extrae y almacena la metadata del proyecto: Código SOFIA del Proyecto (ej. `2417180`), Nombre del Proyecto (*Desarrollo de Software Integrador de Tecnologías Orientadas a Servicios*), Programa (*ADSO - 228118*), versión y número de RAPs por fase.

### CA-02: Mapeo Curricular Preciso por Fase
* Cada Resultado de Aprendizaje (RAP) de los juicios evaluativos cargados se asocia a su fase real a través del código de RAP (6 dígitos) o coincidencia de descripción y competencia:
  * **Fase 1: Análisis:** Competencias técnicas `220501092` y `220501093`, más transversales de inducción (`240201530`), TIC (`220501046`), comunicación (`240201524`), matemáticas inicial (`240201528`), física (`220201501`) e inglés inicial (`240202501`).
  * **Fase 2: Planeación:** Competencias técnicas `220501094` y `220501095`, más transversales de investigación inicial (`240201064`), ética (`240201526`), SST/ambiental (`220601501`), actividad física (`230101507`) e inglés intermedio (`240202501`).
  * **Fase 3: Ejecución:** Competencias técnicas `220501096` (Construcción 1.008 h), `220501097` (Implantación) y `220501098` (Calidad RAP 01), más matemáticas aplicadas (`240201528`) e inglés técnico (`240202501`).
  * **Fase 4: Evaluación:** Competencias `220501098` (Calidad RAPs 02 y 03), `240201064` (Investigación RAPs 03 y 04) e inglés de cierre (`240202501`).

### CA-03: Proyecto Base Pre-cargado
* Si la ficha aún no tiene un archivo de proyecto personalizado adjunto, el sistema inicializa por defecto la matriz oficial del **Proyecto Formativo 2417180 de ADSO**, garantizando que la visualización y filtros de fases sean exactos desde el primer instante.

---

## Estructura de Datos (PostgreSQL & JSON)
```sql
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS codigo_proyecto VARCHAR(50) DEFAULT '2417180';
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS nombre_proyecto VARCHAR(300) DEFAULT 'DESARROLLO DE SOFTWARE INTEGRADOR DE TECNOLOGÍAS ORIENTADAS A SERVICIOS';
ALTER TABLE fichas ADD COLUMN IF NOT EXISTS reporte_proyecto_json JSONB;
```

