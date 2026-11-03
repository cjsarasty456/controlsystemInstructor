import React, { useState, useEffect, useMemo } from 'react';
import { 
  BACKUP_EXPORT_JSON_URL, 
  BACKUP_EXPORT_SQL_URL, 
  fetchServerBackupsApi, 
  restoreServerBackupApi, 
  importBackupFileApi,
  cleanDatabaseApi 
} from '../services/apiService';

export default function BackupModal({
  isOpen,
  onClose,
  onRestoreSuccess,
  fichas = [],
  isBackendOnline = false
}) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import' | 'server'
  const [serverBackups, setServerBackups] = useState([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }
  const [confirmRestoreTarget, setConfirmRestoreTarget] = useState(null);

  // Estados de ordenamiento de respaldos en servidor
  const [backupSortField, setBackupSortField] = useState('lastModified');
  const [backupSortOrder, setBackupSortOrder] = useState('desc');

  const handleSortBackups = (field) => {
    if (backupSortField === field) {
      setBackupSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setBackupSortField(field);
      setBackupSortOrder(field === 'lastModified' || field === 'sizeBytes' ? 'desc' : 'asc');
    }
  };

  const sortedServerBackups = useMemo(() => {
    const list = [...serverBackups];
    return list.sort((a, b) => {
      if (backupSortField === 'sizeBytes') {
        const sA = a.sizeBytes || 0;
        const sB = b.sizeBytes || 0;
        return backupSortOrder === 'asc' ? sA - sB : sB - sA;
      }

      if (backupSortField === 'isSql') {
        const isSqlA = a.isSql ? 1 : 0;
        const isSqlB = b.isSql ? 1 : 0;
        return backupSortOrder === 'asc' ? isSqlA - isSqlB : isSqlB - isSqlA;
      }

      if (backupSortField === 'lastModified') {
        const dA = new Date(a.lastModified).getTime() || 0;
        const dB = new Date(b.lastModified).getTime() || 0;
        return backupSortOrder === 'asc' ? dA - dB : dB - dA;
      }

      const strA = String(a.fileName || a.nombre || '').toLowerCase();
      const strB = String(b.fileName || b.nombre || '').toLowerCase();
      return backupSortOrder === 'asc'
        ? strA.localeCompare(strB, 'es')
        : strB.localeCompare(strA, 'es');
    });
  }, [serverBackups, backupSortField, backupSortOrder]);

  // Totales actuales para el resumen
  const totalFichas = fichas.length;
  const totalAprendices = fichas.reduce((acc, f) => acc + (f.aprendices ? f.aprendices.length : 0), 0);
  const totalJuicios = fichas.reduce((acc, f) => acc + (f.juicios ? f.juicios.length : 0), 0);

  // Cargar lista de copias en el servidor cuando se abre o se cambia a la pestaña 'server'
  const loadServerBackups = async () => {
    if (!isBackendOnline) return;
    setIsLoadingBackups(true);
    try {
      const list = await fetchServerBackupsApi();
      setServerBackups(list || []);
    } catch (err) {
      console.error('Error al consultar copias del servidor:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setSelectedFile(null);
      setConfirmRestoreTarget(null);
      if (activeTab === 'server') {
        loadServerBackups();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Descarga directa con blob para preservar nombre de archivo
  const handleDownload = async (url, defaultName) => {
    try {
      setIsProcessing(true);
      setFeedback(null);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status} al descargar respaldo`);
      
      const disposition = res.headers.get('content-disposition');
      let filename = defaultName;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();

      setFeedback({
        type: 'success',
        text: `Copia de seguridad guardada como "${filename}" y archivada en el servidor (05_Respaldos_y_Recuperacion).`
      });
      loadServerBackups();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error al exportar copia de seguridad: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejador de selección de archivo para importar
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.json') && !name.endsWith('.sql')) {
        setFeedback({ type: 'error', text: 'Formato no soportado. Seleccione un archivo .json o .sql' });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setFeedback(null);
    }
  };

  // Ejecutar importación del archivo seleccionado
  const handleExecuteImport = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const result = await importBackupFileApi(selectedFile);
      const msg = result.mensaje || `Copia "${selectedFile.name}" restaurada con éxito.`;
      setFeedback({ type: 'success', text: msg });
      setSelectedFile(null);
      if (onRestoreSuccess) onRestoreSuccess(msg);
      loadServerBackups();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Fallo al restaurar: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Ejecutar restauración desde archivo en servidor
  const handleExecuteServerRestore = async (fileName) => {
    setIsProcessing(true);
    setFeedback(null);
    setConfirmRestoreTarget(null);
    try {
      const result = await restoreServerBackupApi(fileName);
      const msg = result.mensaje || `Copia "${fileName}" restaurada exitosamente desde el servidor.`;
      setFeedback({ type: 'success', text: msg });
      if (onRestoreSuccess) onRestoreSuccess(msg);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Fallo al restaurar desde servidor: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Limpiar base de datos para pruebas
  const [isConfirmingClean, setIsConfirmingClean] = useState(false);

  const handleCleanDatabase = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      let backendMsg = '';
      if (isBackendOnline) {
        const res = await cleanDatabaseApi();
        backendMsg = res.mensaje || 'Base de datos PostgreSQL limpiada.';
      }
      localStorage.removeItem('controlsystem_fichas_react_v1');
      setIsConfirmingClean(false);
      const fullMsg = backendMsg 
        ? `${backendMsg} Memoria local y tablas restablecidas para pruebas.`
        : 'Almacenamiento local limpiado exitosamente para pruebas.';
      setFeedback({ type: 'success', text: fullMsg });
      if (onRestoreSuccess) onRestoreSuccess(fullMsg);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error al limpiar base de datos: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" style={{ maxWidth: '850px' }}>
        
        {/* Cabecera del Modal */}
        <div className="modal-header" style={{ background: '#00324D', color: '#ffffff' }}>
          <div>
            <h3 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
              <i className="ph ph-database" style={{ color: '#39A900', fontSize: '1.4rem' }}></i>
              Centro de Copias de Seguridad y Recuperación (PostgreSQL)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '0.2rem', display: 'block' }}>
              SENA CIES Regional Huila — Gestión Integral de Respaldos de Base de Datos
            </span>
          </div>
          <button className="close-btn" onClick={onClose} style={{ color: '#ffffff' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0.5rem 1.5rem 0' }}>
          <button
            onClick={() => { setActiveTab('export'); setFeedback(null); }}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'export' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeTab === 'export' ? '700' : '500',
              color: activeTab === 'export' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem'
            }}
          >
            <i className="ph ph-download-simple" style={{ fontSize: '1.1rem' }}></i>
            1. Exportar Respaldo
          </button>

          <button
            onClick={() => { setActiveTab('import'); setFeedback(null); }}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'import' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeTab === 'import' ? '700' : '500',
              color: activeTab === 'import' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem'
            }}
          >
            <i className="ph ph-upload-simple" style={{ fontSize: '1.1rem' }}></i>
            2. Importar Archivo
          </button>

          <button
            onClick={() => { setActiveTab('server'); setFeedback(null); loadServerBackups(); }}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'server' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeTab === 'server' ? '700' : '500',
              color: activeTab === 'server' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem'
            }}
          >
            <i className="ph ph-archive" style={{ fontSize: '1.1rem' }}></i>
            3. Respaldos en Servidor ({serverBackups.length})
          </button>

          <button
            onClick={() => { setActiveTab('clean'); setFeedback(null); }}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'clean' ? '3px solid #dc2626' : '3px solid transparent',
              fontWeight: activeTab === 'clean' ? '700' : '500',
              color: activeTab === 'clean' ? '#dc2626' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem'
            }}
          >
            <i className="ph ph-trash" style={{ fontSize: '1.1rem', color: '#dc2626' }}></i>
            4. Limpiar para Pruebas
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Mensajes de retroalimentación */}
          {feedback && (
            <div style={{
              padding: '0.85rem 1.2rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '0.9rem'
            }}>
              <i className={feedback.type === 'success' ? 'ph ph-check-circle' : 'ph ph-warning-circle'} style={{ fontSize: '1.3rem' }}></i>
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Resumen de estado actual del sistema */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
            background: '#f1f5f9',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#00324D' }}>{totalFichas}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Fichas Registradas</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#39A900' }}>{totalAprendices}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Aprendices en Base de Datos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0284c7' }}>{totalJuicios}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Juicios Evaluativos Detallados</div>
            </div>
          </div>

          {/* TAB 1: EXPORTAR */}
          {activeTab === 'export' && (
            <div>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Seleccione el formato en el cual desea generar y descargar la copia de seguridad. Cada respaldo generado queda automáticamente archivado en el repositorio documental del servidor (<code>05_Administracion_Documental/05_Respaldos_y_Recuperacion/</code>).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* Opción JSON */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div style={{ background: '#e0f2fe', color: '#0284c7', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ph ph-file-code" style={{ fontSize: '1.3rem' }}></i>
                      </div>
                      <h4 style={{ margin: 0, color: '#00324D', fontSize: '1.05rem' }}>Respaldo Estructurado JSON</h4>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4, marginBottom: '1rem' }}>
                      Serializa integralmente las fichas, aprendices con documentos, juicios evaluativos RAPs y evaluaciones del reglamento.
                    </p>
                    <ul style={{ fontSize: '0.78rem', color: '#475569', paddingLeft: '1.2rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      <li>Independiente del motor de base de datos.</li>
                      <li>Fácil de auditar, inspeccionar y versionar.</li>
                      <li>Restaura mediante upsert seguro.</li>
                    </ul>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
                    onClick={() => handleDownload(BACKUP_EXPORT_JSON_URL, 'backup_controlsystem_SENA.json')}
                    disabled={isProcessing || !isBackendOnline}
                  >
                    <i className="ph ph-download-simple"></i>
                    {isProcessing ? 'Generando...' : 'Descargar Respaldo JSON'}
                  </button>
                </div>

                {/* Opción SQL pg_dump */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div style={{ background: '#dcfce7', color: '#16a34a', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ph ph-file-sql" style={{ fontSize: '1.3rem' }}></i>
                      </div>
                      <h4 style={{ margin: 0, color: '#00324D', fontSize: '1.05rem' }}>Respaldo Nativo SQL (pg_dump)</h4>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4, marginBottom: '1rem' }}>
                      Volcado nativo binario/DDL directo desde PostgreSQL con secuencias, esquemas, índices y restricciones referenciales completas.
                    </p>
                    <ul style={{ fontSize: '0.78rem', color: '#475569', paddingLeft: '1.2rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      <li>Generado por utilidad oficial <code>pg_dump</code>.</li>
                      <li>Restaura directamente con <code>psql</code>.</li>
                      <li>Ideal para servidores en producción y desastres.</li>
                    </ul>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
                    onClick={() => handleDownload(BACKUP_EXPORT_SQL_URL, 'backup_controlsystem_SENA.sql')}
                    disabled={isProcessing || !isBackendOnline}
                  >
                    <i className="ph ph-download-simple"></i>
                    {isProcessing ? 'Generando...' : 'Descargar Respaldo SQL'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: IMPORTAR ARCHIVO */}
          {activeTab === 'import' && (
            <div>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Cargue un archivo de respaldo previo (<code>.json</code> o <code>.sql</code>) para sincronizar o restaurar la base de datos de control.
              </p>

              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '2rem',
                textAlign: 'center',
                background: selectedFile ? '#f0fdf4' : '#f8fafc',
                cursor: 'pointer',
                marginBottom: '1.25rem',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('backup-file-input').click()}
              >
                <input
                  id="backup-file-input"
                  type="file"
                  accept=".json,.sql"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div style={{ fontSize: '2.5rem', color: selectedFile ? '#39A900' : '#94a3b8', marginBottom: '0.5rem' }}>
                  <i className={selectedFile ? 'ph ph-file-check' : 'ph ph-cloud-arrow-up'}></i>
                </div>
                {selectedFile ? (
                  <div>
                    <strong style={{ color: '#00324D', display: 'block', fontSize: '1rem' }}>{selectedFile.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB — Listo para restaurar
                    </span>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: '#00324D', display: 'block', fontSize: '0.95rem' }}>Haga clic para seleccionar archivo de respaldo</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Archivos soportados: .json (estructurado) o .sql (volcado PostgreSQL)</span>
                  </div>
                )}
              </div>

              {/* Advertencia de Seguridad */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: '#92400e'
              }}>
                <i className="ph ph-warning" style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}></i>
                <div>
                  <strong>Aviso de Sobrescritura / Sincronización:</strong>
                  <p style={{ margin: '0.2rem 0 0', lineHeight: 1.4 }}>
                    La restauración integrará los aprendices, fichas y juicios contenidos en la copia. Si ya existen, se actualizarán con los valores del archivo de respaldo sin duplicar registros.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedFile(null)}
                  disabled={!selectedFile || isProcessing}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleExecuteImport}
                  disabled={!selectedFile || isProcessing || !isBackendOnline}
                  style={{ gap: '0.5rem' }}
                >
                  <i className="ph ph-arrow-counter-clockwise"></i>
                  {isProcessing ? 'Restaurando...' : 'Restaurar Base de Datos Ahora'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESPALDOS EN SERVIDOR */}
          {activeTab === 'server' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                  Copias de seguridad archivadas en el servidor (<code>05_Respaldos_y_Recuperacion/</code>):
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.4rem' }}
                  onClick={loadServerBackups}
                  disabled={isLoadingBackups}
                >
                  <i className="ph ph-arrows-clockwise"></i>
                  Actualizar
                </button>
              </div>

              {isLoadingBackups ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <i className="ph ph-spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '1.5rem' }}></i>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Consultando respaldos en el servidor...</p>
                </div>
              ) : serverBackups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <i className="ph ph-folder-open" style={{ fontSize: '2rem', color: '#94a3b8' }}></i>
                  <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                    No se encontraron respaldos archivados en la carpeta del servidor.
                  </p>
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                        <th 
                          onClick={() => handleSortBackups('fileName')} 
                          style={{ padding: '0.65rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                          title="Ordenar por Nombre de Archivo"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Archivo</span>
                            <i className={`ph ${backupSortField === 'fileName' ? (backupSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: backupSortField === 'fileName' ? '#00324D' : '#94a3b8' }}></i>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortBackups('isSql')} 
                          style={{ padding: '0.65rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                          title="Ordenar por Tipo de Archivo"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Tipo</span>
                            <i className={`ph ${backupSortField === 'isSql' ? (backupSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: backupSortField === 'isSql' ? '#00324D' : '#94a3b8' }}></i>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortBackups('sizeBytes')} 
                          style={{ padding: '0.65rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                          title="Ordenar por Tamaño"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Tamaño</span>
                            <i className={`ph ${backupSortField === 'sizeBytes' ? (backupSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: backupSortField === 'sizeBytes' ? '#00324D' : '#94a3b8' }}></i>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortBackups('lastModified')} 
                          style={{ padding: '0.65rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                          title="Ordenar por Fecha de Creación"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Fecha de Creación</span>
                            <i className={`ph ${backupSortField === 'lastModified' ? (backupSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: backupSortField === 'lastModified' ? '#00324D' : '#94a3b8' }}></i>
                          </div>
                        </th>
                        <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedServerBackups.map((bk, idx) => {
                        const name = bk.fileName || bk.nombre;
                        const isSqlFile = bk.isSql !== undefined ? bk.isSql : (name.endsWith('.sql') || name.endsWith('.sql.gz'));
                        const typeLabel = isSqlFile ? 'SQL' : 'JSON';
                        const size = bk.sizeReadable || bk.tamano;
                        const date = bk.lastModified || bk.fechaModificacion || 'N/A';

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                            <td style={{ padding: '0.65rem 1rem', fontWeight: '600', color: '#00324D' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className={!isSqlFile ? 'ph ph-file-code' : 'ph ph-file-sql'} style={{ color: !isSqlFile ? '#0284c7' : '#16a34a', fontSize: '1.1rem' }}></i>
                                <span>{name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 1rem' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: !isSqlFile ? '#e0f2fe' : '#dcfce7',
                                color: !isSqlFile ? '#0369a1' : '#15803d'
                              }}>
                                {typeLabel}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>{size}</td>
                            <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>{date}</td>
                            <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', gap: '0.35rem' }}
                                onClick={() => setConfirmRestoreTarget(bk)}
                                disabled={isProcessing}
                                title="Restaurar esta copia de seguridad en la base de datos"
                              >
                                <i className="ph ph-arrow-counter-clockwise"></i>
                                Restaurar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Confirmación Modal para Restaurar desde Servidor */}
              {confirmRestoreTarget && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <i className="ph ph-warning-circle" style={{ color: '#d97706', fontSize: '1.3rem' }}></i>
                    <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
                      ¿Confirmar restauración de "{confirmRestoreTarget.fileName || confirmRestoreTarget.nombre}"?
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>
                    Esta acción sincronizará los registros de PostgreSQL con los datos almacenados en este archivo.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => setConfirmRestoreTarget(null)}
                      disabled={isProcessing}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: '#d97706', borderColor: '#d97706' }}
                      onClick={() => handleExecuteServerRestore(confirmRestoreTarget.fileName || confirmRestoreTarget.nombre)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Restaurando...' : 'Sí, Restaurar Ahora'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PESTAÑA 4: Limpiar Base de Datos para Pruebas */}
          {activeTab === 'clean' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <i className="ph ph-warning" style={{ fontSize: '1.8rem', color: '#e11d48', marginTop: '0.15rem' }}></i>
                <div>
                  <h4 style={{ margin: '0 0 0.35rem', color: '#9f1239', fontSize: '1.05rem', fontWeight: '700' }}>
                    Limpieza Total para Pruebas de Desarrollo
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#be123c', lineHeight: '1.45' }}>
                    Esta función vacía todas las tablas en la base de datos PostgreSQL (Fichas, Aprendices, Juicios de RAPs, Historial de Cargues y Citaciones) y reinicia el almacenamiento local del navegador, permitiendo iniciar un nuevo ciclo de pruebas desde cero sin necesidad de comandos manuales en la terminal.
                  </p>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem 1.25rem'
              }}>
                <h5 style={{ margin: '0 0 0.6rem', color: '#00324D', fontSize: '0.88rem' }}>
                  Elementos que se restablecerán a cero (0):
                </h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li><strong>Fichas de Formación:</strong> Se eliminan todas las fichas creadas en base de datos.</li>
                  <li><strong>Aprendices y Juicios:</strong> Se vacían los aprendices y sus RAPs evaluados de SOFIA Plus.</li>
                  <li><strong>Historial de Cargues:</strong> Se resetea el consecutivo de archivos Excel procesados.</li>
                  <li><strong>Caché del Navegador:</strong> Se borra la clave <code>controlsystem_fichas_react_v1</code> de localStorage.</li>
                </ul>
              </div>

              {!isConfirmingClean ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    className="btn btn-primary"
                    style={{
                      background: '#dc2626',
                      borderColor: '#dc2626',
                      padding: '0.65rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '700'
                    }}
                    onClick={() => setIsConfirmingClean(true)}
                    disabled={isProcessing}
                  >
                    <i className="ph ph-trash" style={{ fontSize: '1.15rem' }}></i>
                    Limpiar Base de Datos para Pruebas
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '1.1rem 1.25rem',
                  background: '#fef2f2',
                  border: '1px solid #f87171',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="ph ph-warning-octagon" style={{ color: '#dc2626', fontSize: '1.4rem' }}></i>
                    <strong style={{ color: '#991b1b', fontSize: '0.95rem' }}>
                      ¿Confirmar limpieza total de la base de datos?
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#7f1d1d' }}>
                    Esta acción es irreversible y dejará el sistema en estado completamente virgen para realizar nuevas pruebas de cargue.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                      onClick={() => setIsConfirmingClean(false)}
                      disabled={isProcessing}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{
                        background: '#991b1b',
                        borderColor: '#991b1b',
                        fontSize: '0.82rem',
                        padding: '0.4rem 0.9rem',
                        fontWeight: '700'
                      }}
                      onClick={handleCleanDatabase}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Limpiando...' : 'Sí, Limpiar Base de Datos Ahora'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: isBackendOnline ? '#059669' : '#dc2626' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isBackendOnline ? '#10b981' : '#ef4444' }}></span>
            <span>{isBackendOnline ? 'Motor PostgreSQL Conectado y Operativo' : 'Backend fuera de línea (Requiere Java + PostgreSQL)'}</span>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
