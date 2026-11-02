# HU-007: Gestión y Consulta de Fichas de Formación

## 1. Historia de Usuario

**Como** instructor del SENA,  
**quiero** registrar, consultar, filtrar y gestionar las fichas de formación académica desde una pantalla dedicada,  
**para** centralizar el control de los grupos a mi cargo, acceder rápidamente a la información de cada ficha y asociar adecuadamente los aprendices, asistencias y evaluaciones.

---

## 2. Criterios de Aceptación

### CA-01: Registro de Ficha de Formación
- El instructor puede registrar una nueva ficha ingresando los siguientes campos obligatorios:
  - **Número de Ficha:** Código numérico único (ej. `3145555`, `3145556`). No debe permitir duplicados.
  - **Programa de Formación:** Nombre del programa (ej. *"Tecnología en Análisis y Desarrollo de Software - ADSO"*).
  - **Código del Programa:** Código institucional del diseño curricular (ej. `228118`).
  - **Jornada:** Selección entre `Diurna`, `Nocturna`, `Mixta` o `Virtual`.
  - **Fecha de Inicio:** Fecha de inicio de la etapa lectiva.
  - **Fecha de Fin Estimada:** Fecha proyectada de finalización.
  - **Sede / Centro de Formación:** Centro de formación asignado (ej. *"Centro de la Industria, la Empresa y los Servicios - CIES"*).
- El sistema valida que el número de ficha contenga solo dígitos y tenga entre 6 y 10 caracteres.
- El sistema asigna por defecto el estado inicial `Activa`.

### CA-02: Consulta y Listado de Fichas
- El sistema muestra una lista visual (tarjetas o lista interactiva) con todas las fichas registradas.
- Cada tarjeta de ficha en la lista debe mostrar:
  - Número de ficha en tipografía destacada.
  - Nombre del programa de formación.
  - Insignia (badge) con el estado (`Activa`, `Etapa Productiva`, `Finalizada`, `Inactiva`).
  - Contador de aprendices vinculados.
  - Fechas clave (inicio / fin).
- Al seleccionar una ficha, el sistema abre la vista detallada de la ficha con acceso a sus módulos dependientes (aprendices, llamados de asistencia, trabajos y evidencias).

### CA-03: Filtrado y Búsqueda en Tiempo Real
- El sistema provee un campo de búsqueda por texto que filtra dinámicamente por:
  - Número de ficha.
  - Nombre del programa de formación.
  - Centro o sede.
- El sistema provee chips / selectores de filtro rápido por:
  - **Estado:** `Todas`, `Activas`, `En Etapa Productiva`, `Finalizadas`.
  - **Jornada:** `Todas`, `Diurna`, `Nocturna`, `Virtual`.
- El sistema permite ordenar la lista por:
  - Número de ficha (ascendente / descendente).
  - Fecha de registro más reciente.
  - Nombre del programa (A-Z).
- Si no hay resultados que coincidan con la búsqueda o filtro aplicado, se muestra una pantalla de estado vacío (*Empty State*) con la opción de limpiar filtros.

### CA-04: Edición y Actualización de Fichas
- El instructor puede modificar los datos de una ficha existente (a excepción del número de ficha que actúa como identificador institucional primario o con confirmación explícita).
- El instructor puede cambiar el estado de la ficha (ej. pasar de `Activa` a `En Etapa Productiva` o `Finalizada`).
- El sistema registra la fecha y hora de la última modificación.

### CA-05: Eliminación o Archivado Lógico
- No se permite eliminación física si la ficha ya tiene aprendices, asistencias o evaluaciones asociadas.
- Si tiene dependencias, el sistema ofrece la opción de **Archivar / Desactivar** la ficha para mantener la integridad histórica.
- Si no tiene registros asociados, permite la eliminación con cuadro de confirmación modal previo.

---

## 3. Especificación de la Pantalla (Front-end React Native)

### 3.1 Componentes de la Pantalla Principal (`FichasScreen`)
1. **Header / Encabezado:**
   - Título: *"Fichas de Formación"*.
   - Contador total de fichas activas.
   - Botón de acción: `+ Nueva Ficha` o botón flotante (FAB).
2. **Barra de Búsqueda y Filtros:**
   - `SearchBar` con botón de limpiar texto (`clear`).
   - Carrusel horizontal de Chips de filtro por estado (`Activas`, `Productiva`, `Finalizadas`).
   - Botón modal de filtros avanzados (jornada, rango de fechas).
3. **Lista de Fichas (`FlatList` / Tarjetas):**
   - Tarjeta (`FichaCard`):
     - Cabecera: `Ficha #XXXXXXX` + Badge de estado con color (Verde = Activa, Azul = Productiva, Gris = Finalizada).
     - Cuerpo: Título del programa y jornada.
     - Pie de tarjeta: Íconos informativos con cantidad de aprendices y fechas.
     - Botón de menú de opciones contextuales (Editar, Archivar, Ver detalles).
4. **Estados de la Interfaz:**
   - **Cargando (`LoadingSkeleton`):** Indicadores esqueléticos mientras se obtienen los datos.
   - **Vacío (`EmptyState`):** Gráfico/ilustración cuando no hay fichas creadas o filtradas, con botón *"Registrar mi primera ficha"*.

### 3.2 Modal o Formulario de Registro/Edición (`FichaFormModal`)
- Modal deslizante o pantalla apilada con validación en tiempo real.
- Campos con etiquetas claras y mensajes de error accesibles.
- Botones de acción: *"Cancelar"* y *"Guardar Ficha"*.

---

## 4. Modelo de Datos Proyectado (PostgreSQL)

```sql
CREATE TABLE fichas (
    id SERIAL PRIMARY KEY,
    numero_ficha VARCHAR(20) NOT NULL UNIQUE,
    programa_nombre VARCHAR(255) NOT NULL,
    programa_codigo VARCHAR(50),
    jornada VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    sede_centro VARCHAR(255) DEFAULT 'CIES - Regional Huila',
    estado VARCHAR(30) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'ETAPA_PRODUCTIVA', 'FINALIZADA', 'INACTIVA')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fichas_numero ON fichas(numero_ficha);
CREATE INDEX idx_fichas_estado ON fichas(estado);
```

---

## 5. Datos de Prueba

| Campo | Registro de Prueba 1 | Registro de Prueba 2 | Registro de Prueba 3 |
|---|---|---|---|
| **Número de Ficha** | `3145555` | `3145556` | `3239137` |
| **Programa** | ADSO (Análisis y Desarrollo de Software) | ADSO (Análisis y Desarrollo de Software) | ADSO (Análisis y Desarrollo de Software) |
| **Código Programa** | `228118` | `228118` | `228118` |
| **Jornada** | Diurna | Diurna | Mixta / Nocturna |
| **Fecha Inicio** | `2024-04-15` | `2024-04-15` | `2024-10-01` |
| **Fecha Fin** | `2026-07-15` | `2026-07-15` | `2026-12-15` |
| **Estado** | `ACTIVA` | `ACTIVA` | `ACTIVA` |
| **Sede** | CIES - Neiva | CIES - Neiva | CIES - Neiva |

---

## 6. Endpoints Sugeridos para el Back-end (Spring Boot)

* `GET /api/v1/fichas`: Listar fichas con soporte de paginación y parámetros de filtro (`?search=...&estado=...&jornada=...`).
* `GET /api/v1/fichas/{id}`: Obtener el detalle completo de una ficha con estadísticas asociadas.
* `POST /api/v1/fichas`: Registrar una nueva ficha (valida unicidad del número).
* `PUT /api/v1/fichas/{id}`: Actualizar datos de una ficha.
* `PATCH /api/v1/fichas/{id}/estado`: Cambiar rápidamente el estado de la ficha.
* `DELETE /api/v1/fichas/{id}`: Eliminación lógica o física validando dependencias de aprendices.

