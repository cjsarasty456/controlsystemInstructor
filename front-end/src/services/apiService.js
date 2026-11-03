/**
 * Servicio de Comunicación REST con el Backend Spring Boot (Java 17 + PostgreSQL)
 * Base URL: http://localhost:8080/api
 */

const API_BASE_URL = 'http://localhost:8080/api';

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
};

export const fetchFichasApi = async () => {
  const res = await fetch(`${API_BASE_URL}/fichas`, { method: 'GET' });
  if (!res.ok) throw new Error(`Error ${res.status} al consultar fichas del backend.`);
  return await res.json();
};

export const fetchFichaDetailApi = async (idOrNumero) => {
  const res = await fetch(`${API_BASE_URL}/fichas/${idOrNumero}`, { method: 'GET' });
  if (!res.ok) throw new Error(`Error ${res.status} al consultar detalle de ficha ${idOrNumero}.`);
  return await res.json();
};

export const createFichaApi = async (fichaData) => {
  const res = await fetch(`${API_BASE_URL}/fichas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fichaData)
  });
  if (!res.ok) throw new Error(`Error ${res.status} al registrar ficha en backend.`);
  return await res.json();
};

export const uploadJuiciosExcelApi = async (fichaId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/fichas/${fichaId}/juicios/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Error ${res.status} al procesar archivo en el servidor.`);
  }

  return await res.json();
};

export const saveProjectReportApi = async (fichaId, projectData) => {
  const res = await fetch(`${API_BASE_URL}/fichas/${fichaId}/proyecto`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reporteProyecto: JSON.stringify(projectData) })
  });

  if (!res.ok) throw new Error(`Error ${res.status} al guardar reporte de proyecto.`);
  return await res.json();
};

export const saveEvaluationApi = async (evalData) => {
  const res = await fetch(`${API_BASE_URL}/reglamento/evaluar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evalData)
  });

  if (!res.ok) throw new Error(`Error ${res.status} al guardar evaluación en el servidor.`);
  return await res.json();
};

export const fetchEvaluacionesApi = async (fichaId) => {
  const res = await fetch(`${API_BASE_URL}/fichas/${fichaId}/evaluaciones`, { method: 'GET' });
  if (!res.ok) throw new Error(`Error ${res.status} al consultar evaluaciones.`);
  return await res.json();
};

// ==========================================
// Copias de Seguridad (Backup y Restauración)
// ==========================================

export const BACKUP_EXPORT_JSON_URL = `${API_BASE_URL}/backup/export`;
export const BACKUP_EXPORT_SQL_URL = `${API_BASE_URL}/backup/export/sql`;

export const fetchServerBackupsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/backup/list`, { method: 'GET' });
  if (!res.ok) throw new Error(`Error ${res.status} al listar copias de seguridad del servidor.`);
  return await res.json();
};

export const restoreServerBackupApi = async (fileName) => {
  const res = await fetch(`${API_BASE_URL}/backup/restore-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status} al restaurar copia de seguridad.`);
  }
  return await res.json();
};

export const importBackupFileApi = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/backup/import`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status} al importar copia de seguridad.`);
  }
  return await res.json();
};

export const cleanDatabaseApi = async () => {
  const res = await fetch(`${API_BASE_URL}/backup/clean-database`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status} al limpiar la base de datos.`);
  }
  return await res.json();
};


