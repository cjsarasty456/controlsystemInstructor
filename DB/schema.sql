-- ============================================================
-- SISTEMA DE CONTROL DE INSTRUCTORES — SENA CIES HUILA
-- Esquema DDL Oficial de Base de Datos (PostgreSQL) con UUID
-- ============================================================

-- Extensión UUID (nativa en PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Fichas de Formación (HU-007)
CREATE TABLE IF NOT EXISTS fichas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ficha VARCHAR(20) NOT NULL UNIQUE,
    programa_nombre VARCHAR(255) NOT NULL,
    programa_codigo VARCHAR(50) DEFAULT '228118',
    programa_version VARCHAR(20) DEFAULT '1',
    jornada VARCHAR(50) NOT NULL, -- PRESENCIAL, MIXTA, VIRTUAL
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    sede_centro VARCHAR(255) DEFAULT '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
    regional VARCHAR(150) DEFAULT '41 - REGIONAL HUILA',
    estado VARCHAR(30) DEFAULT 'EN EJECUCION' CHECK (estado IN ('EN EJECUCION', 'ACTIVA', 'ETAPA PRODUCTIVA', 'FINALIZADA', 'CANCELADA')),
    reporte_proyecto_json TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fichas_numero ON fichas(numero_ficha);
CREATE INDEX IF NOT EXISTS idx_fichas_estado ON fichas(estado);

-- 2. Tabla de Aprendices Matriculados en Ficha (1 registro por persona por ficha)
CREATE TABLE IF NOT EXISTS aprendices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(10) NOT NULL, -- CC, TI, CE, PPT
    numero_documento VARCHAR(25) NOT NULL,
    nombres VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    correo_institucional VARCHAR(150),
    celular VARCHAR(30),
    estado_sena VARCHAR(50) DEFAULT 'EN FORMACION',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_aprendiz_documento_ficha UNIQUE (numero_documento, ficha_id)
);

CREATE INDEX IF NOT EXISTS idx_aprendices_documento ON aprendices(numero_documento);
CREATE INDEX IF NOT EXISTS idx_aprendices_ficha ON aprendices(ficha_id);

-- 3. Tabla de Historial y Registro de Cada Cargue de Actualización (Auditoría)
CREATE TABLE IF NOT EXISTS historial_cargues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    consecutivo_cargue INT NOT NULL,
    nombre_archivo_original VARCHAR(255) NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    fecha_reporte_sena DATE,
    fecha_cargue TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_filas_procesadas INT NOT NULL,
    aprendices_afectados INT NOT NULL,
    juicios_nuevos_aprobados INT DEFAULT 0,
    juicios_pendientes INT DEFAULT 0,
    juicios_no_aprobados INT DEFAULT 0,
    subido_por VARCHAR(150) DEFAULT 'Carlos Julio Cadena',
    observaciones TEXT
);

CREATE INDEX IF NOT EXISTS idx_cargues_ficha ON historial_cargues(ficha_id);

-- 4. Detalle de Juicios Evaluativos por RAP y Aprendiz (1 registro por Aprendiz + RAP)
CREATE TABLE IF NOT EXISTS juicios_evaluativos_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    aprendiz_id UUID NOT NULL REFERENCES aprendices(id) ON DELETE CASCADE,
    cargue_id UUID REFERENCES historial_cargues(id) ON DELETE SET NULL,
    competencia_denominacion TEXT NOT NULL,
    resultado_aprendizaje TEXT NOT NULL,
    juicio_evaluacion VARCHAR(50) NOT NULL, -- APROBADO, NO APROBADO, POR EVALUAR
    fecha_hora_juicio TIMESTAMP,
    funcionario_registro VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_juicio_aprendiz_rap UNIQUE (aprendiz_id, resultado_aprendizaje)
);

CREATE INDEX IF NOT EXISTS idx_juicios_reporte ON juicios_evaluativos_detalle(cargue_id);
CREATE INDEX IF NOT EXISTS idx_juicios_aprendiz ON juicios_evaluativos_detalle(aprendiz_id);
CREATE INDEX IF NOT EXISTS idx_juicios_evaluacion ON juicios_evaluativos_detalle(juicio_evaluacion);

-- 5. Tabla de Llamado de Asistencia (HU-003)
CREATE TABLE IF NOT EXISTS sesiones_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    fecha_sesion DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    tema_sesion VARCHAR(255),
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID NOT NULL REFERENCES sesiones_asistencia(id) ON DELETE CASCADE,
    aprendiz_id UUID NOT NULL REFERENCES aprendices(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('PRESENTE', 'AUSENTE', 'JUSTIFICADO')),
    observacion VARCHAR(255),
    CONSTRAINT uq_asistencia_sesion_aprendiz UNIQUE (sesion_id, aprendiz_id)
);

-- 6. Tabla de Evaluaciones según el Reglamento del Aprendiz (HU-005)
CREATE TABLE IF NOT EXISTS evaluaciones_reglamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    aprendiz_id UUID NOT NULL REFERENCES aprendices(id) ON DELETE CASCADE,
    motivo VARCHAR(50) NOT NULL, -- ACADEMICO, INASISTENCIA, DESERCION, DISCIPLINARIO
    gravedad VARCHAR(20) NOT NULL, -- LEVE, GRAVE, GRAVISIMA
    clasificacion_falta VARCHAR(150) NOT NULL,
    medida_recomendada TEXT NOT NULL,
    articulos_invocados JSONB NOT NULL,
    requiere_comite BOOLEAN DEFAULT FALSE,
    texto_citacion TEXT NOT NULL,
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    instructor_responsable VARCHAR(150) DEFAULT 'Carlos Julio Cadena',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eval_reglamento_aprendiz ON evaluaciones_reglamento(aprendiz_id);
CREATE INDEX IF NOT EXISTS idx_eval_reglamento_ficha ON evaluaciones_reglamento(ficha_id);

-- 7. Documentos del Reglamento del Aprendiz y Proyecto Formativo Cargados (HU-005 & HU-009)
CREATE TABLE IF NOT EXISTS documentos_reglamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_archivo VARCHAR(255) NOT NULL,
    version_norma VARCHAR(100) DEFAULT 'Acuerdo 007 de 2012 / Vigente 2026',
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tamano_bytes BIGINT,
    activo BOOLEAN DEFAULT TRUE
);
