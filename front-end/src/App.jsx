import React, { useState, useEffect } from 'react';
import FichasView from './components/FichasView';
import FichaDetailView from './components/FichaDetailView';
import AsistenteView from './components/AsistenteView';
import FichaModal from './components/FichaModal';
import PreviewReportModal from './components/PreviewReportModal';
import BackupModal from './components/BackupModal';
import { loadFichas, saveFichas } from './services/storage';
import { parseSenaExcelReport } from './services/excelParser';
import { 
  checkBackendHealth, 
  fetchFichasApi, 
  fetchFichaDetailApi, 
  createFichaApi, 
  uploadJuiciosExcelApi, 
  saveProjectReportApi,
  cleanDatabaseApi 
} from './services/apiService';
import { DEFAULT_ADSO_PROJECT } from './services/projectReportService';
import { generateUUID } from './utils/uuid';

export default function App() {
  const [fichas, setFichas] = useState([]);
  const [currentFichaId, setCurrentFichaId] = useState(null);
  const [activeNav, setActiveNav] = useState('fichas');
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [previewParsedData, setPreviewParsedData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState({ online: false, info: null });
  const [lastUploadedFile, setLastUploadedFile] = useState(null);

  // Sincronización inicial con Backend Spring Boot (o fallback a almacenamiento local)
  const syncWithBackend = async () => {
    try {
      const health = await checkBackendHealth();
      if (health && health.status === 'UP') {
        setBackendStatus({ online: true, info: health });
        const backendFichas = await fetchFichasApi();
        if (Array.isArray(backendFichas) && backendFichas.length > 0) {
          const mapped = await Promise.all(backendFichas.map(async (bf) => {
            let parsedProject = DEFAULT_ADSO_PROJECT;
            if (bf.reporteProyectoJson) {
              try { parsedProject = JSON.parse(bf.reporteProyectoJson); } catch (e) {}
            }
            
            // Cargar detalle completo de cada ficha desde PostgreSQL
            try {
              const detail = await fetchFichaDetailApi(bf.numero || bf.id);
              return {
                ...detail,
                id: bf.id || generateUUID(),
                backendId: bf.id,
                reporteProyecto: parsedProject,
                aprendices: detail.aprendices || [],
                juicios: detail.juicios || [],
                reportes: detail.reportes || []
              };
            } catch (err) {
              return {
                ...bf,
                id: bf.id || generateUUID(),
                backendId: bf.id,
                reporteProyecto: parsedProject
              };
            }
          }));

          setFichas(mapped);
          saveFichas(mapped);
          return;
        }
      } else {
        setBackendStatus({ online: false, info: null });
      }
    } catch (err) {
      setBackendStatus({ online: false, info: null });
    }

    // Fallback a almacenamiento local del navegador si backend está desconectado
    const loaded = loadFichas();
    setFichas(loaded);
  };

  useEffect(() => {
    syncWithBackend();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleBackupRestoreSuccess = async (msg) => {
    showToast(msg || 'Copia de seguridad restaurada exitosamente.');
    await syncWithBackend();
  };

  const currentFicha = fichas.find(f => f.id === currentFichaId);

  // Navegación
  const handleSelectFicha = async (id) => {
    setCurrentFichaId(id);
    setActiveNav('fichas_detail');

    if (backendStatus.online) {
      const f = fichas.find(item => item.id === id);
      if (f) {
        try {
          const detail = await fetchFichaDetailApi(f.numero || f.backendId || id);
          setFichas(prev => prev.map(item => {
            if (item.id === id) {
              return {
                ...item,
                aprendices: detail.aprendices || [],
                juicios: detail.juicios || [],
                reportes: detail.reportes || []
              };
            }
            return item;
          }));
        } catch (e) {
          console.warn("No se pudo obtener detalle fresco de backend, usando datos en caché.", e);
        }
      }
    }
  };

  const handleBackToFichas = () => {
    setActiveNav('fichas');
  };

  const handleNavClick = (view) => {
    if (view === 'fichas') {
      setActiveNav('fichas');
    } else if (view === 'reportes') {
      if (currentFichaId) {
        setActiveNav('fichas_detail');
      } else if (fichas.length > 0) {
        setCurrentFichaId(fichas[0].id);
        setActiveNav('fichas_detail');
      }
    } else if (view === 'asistente') {
      setActiveNav('asistente');
    }
  };

  // Guardar Nueva Ficha (HU-007)
  const handleSaveFicha = async (newFichaData) => {
    const exists = fichas.find(f => f.numero === newFichaData.numero);
    if (exists) {
      alert(`La ficha número ${newFichaData.numero} ya se encuentra registrada.`);
      return;
    }

    let backendId = null;
    if (backendStatus.online) {
      try {
        const savedBackend = await createFichaApi({
          numeroFicha: newFichaData.numero,
          programaNombre: newFichaData.programa,
          programaCodigo: newFichaData.codigo || '228118',
          programaVersion: newFichaData.version || '1',
          jornada: newFichaData.jornada || 'PRESENCIAL',
          fechaInicio: newFichaData.fechaInicio || '2024-12-16',
          fechaFin: newFichaData.fechaFin || '2027-05-07',
          regional: newFichaData.regional || '41 - REGIONAL HUILA',
          sedeCentro: newFichaData.centro || '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
          estado: newFichaData.estado || 'EN EJECUCION',
          reporteProyectoJson: newFichaData.reporteProyecto ? JSON.stringify(newFichaData.reporteProyecto) : null
        });
        backendId = savedBackend.id;
      } catch (e) {
        console.warn("Fallo guardado en backend, guardando localmente.", e);
      }
    }

    const fichaUUID = backendId || generateUUID();
    const newFicha = {
      id: fichaUUID,
      backendId: fichaUUID,
      ...newFichaData,
      reporteProyecto: newFichaData.reporteProyecto !== undefined
        ? newFichaData.reporteProyecto
        : (newFichaData.tipoFormacion === 'COMPLEMENTARIA' ? null : DEFAULT_ADSO_PROJECT),
      aprendices: [],
      historialCargues: [],
      reportes: [],
      juicios: []
    };

    const updated = [newFicha, ...fichas];
    setFichas(updated);
    saveFichas(updated);
    setIsFichaModalOpen(false);
    showToast(`Ficha ${newFichaData.numero} registrada exitosamente${backendStatus.online ? ' en PostgreSQL' : ''}.`);
  };

  // Guardar Nuevo Reporte de Proyecto Formativo (HU-009)
  const handleSaveProjectReport = async (customProject) => {
    if (!currentFicha) return;

    if (backendStatus.online && currentFicha.backendId) {
      try {
        await saveProjectReportApi(currentFicha.backendId, customProject);
      } catch (e) {
        console.warn("Fallo guardado de proyecto en backend.", e);
      }
    }

    const updated = fichas.map(f => {
      if (f.id === currentFicha.id) {
        return {
          ...f,
          reporteProyecto: customProject
        };
      }
      return f;
    });
    setFichas(updated);
    saveFichas(updated);
    showToast(`Reporte de Proyecto "${customProject.codigoProyecto || '2417180'}" vinculado a la ficha.`);
  };

  // Carga de Excel (HU-008)
  const handleExcelUpload = async (file) => {
    try {
      setLastUploadedFile(file);
      const parsed = await parseSenaExcelReport(file);
      setPreviewParsedData(parsed);
    } catch (err) {
      console.error("Error al procesar el archivo Excel:", err);
      alert("Error al leer el archivo Excel. Asegúrate de que corresponda al reporte oficial de SOFIA Plus.");
    }
  };

  // Limpiar Base de Datos para Pruebas (PostgreSQL + LocalStorage)
  const handleCleanDatabaseForTesting = async () => {
    const confirmClean = window.confirm(
      "¿Desea limpiar completamente la Base de Datos para pruebas?\n\nEsta acción eliminará todas las fichas, aprendices, juicios de RAPs e historial de cargues en PostgreSQL y reiniciará el almacenamiento local para iniciar un nuevo ciclo de pruebas limpias."
    );
    if (!confirmClean) return;

    try {
      if (backendStatus.online) {
        await cleanDatabaseApi();
      }
      localStorage.removeItem('controlsystem_fichas_react_v1');
      setFichas([]);
      setCurrentFichaId(null);
      showToast("Base de datos PostgreSQL y caché limpiados exitosamente para pruebas.");
    } catch (err) {
      console.error("Error al limpiar BD:", err);
      alert("Error al limpiar la base de datos: " + err.message);
    }
  };

  // Confirmar Importación con Deduplicación y Registro de Actualización
  const handleConfirmImport = async () => {
    if (!previewParsedData || !currentFicha) return;

    // Si el backend Spring Boot está conectado, sincronizar archivo en PostgreSQL
    const fichaTargetId = currentFicha.backendId || currentFicha.id;
    if (backendStatus.online && lastUploadedFile && fichaTargetId) {
      try {
        const uploadResult = await uploadJuiciosExcelApi(fichaTargetId, lastUploadedFile);
        showToast(`Backend: ${uploadResult.mensaje} (${uploadResult.aprendicesUnicos} aprendices únicos en PostgreSQL).`);
        
        // Recargar detalle fresco desde backend
        const detail = await fetchFichaDetailApi(currentFicha.numero || fichaTargetId);
        setFichas(prev => prev.map(item => {
          if (item.id === currentFicha.id) {
            return {
              ...item,
              aprendices: detail.aprendices || [],
              juicios: detail.juicios || [],
              reportes: detail.reportes || []
            };
          }
          return item;
        }));
        setPreviewParsedData(null);
        setLastUploadedFile(null);
        return;
      } catch (err) {
        console.warn("Fallo subida a backend, aplicando actualización local.", err);
      }
    }

    // Proceso local existente (garantiza funcionamiento offline o inmediato)
    const parsed = previewParsedData;
    const timestampActual = new Date().toLocaleString();

    let juiciosNuevosAprobados = 0;
    let juiciosActualizados = 0;
    let aprendicesNuevos = 0;
    let aprendicesActualizados = 0;

    const MOCK_DOCS_SET = new Set(['1075254123', '1075345678', '1075987654', '1080123456', '1081654321']);

    const updatedFichas = fichas.map(f => {
      if (f.id === currentFicha.id) {
        const learnersMap = new Map();
        
        (f.aprendices || []).forEach(apr => {
          const doc = String(apr.numDoc || '').trim();
          if (!MOCK_DOCS_SET.has(doc)) {
            learnersMap.set(doc, { ...apr, raps: [...(apr.raps || [])] });
          }
        });

        parsed.aprendices.forEach(inApr => {
          if (learnersMap.has(inApr.numDoc)) {
            aprendicesActualizados++;
            const existingApr = learnersMap.get(inApr.numDoc);
            existingApr.nombreCompleto = inApr.nombreCompleto;
            existingApr.estado = inApr.estado;

            inApr.raps.forEach(newRap => {
              const existingRapIdx = existingApr.raps.findIndex(r => r.rap === newRap.rap);
              if (existingRapIdx >= 0) {
                const prevJuicio = existingApr.raps[existingRapIdx].juicio;
                if (prevJuicio !== newRap.juicio) {
                  juiciosActualizados++;
                  if (newRap.juicio === 'APROBADO') juiciosNuevosAprobados++;
                  existingApr.raps[existingRapIdx] = newRap;
                }
              } else {
                existingApr.raps.push(newRap);
                if (newRap.juicio === 'APROBADO') juiciosNuevosAprobados++;
              }
            });

            existingApr.aprobados = existingApr.raps.filter(r => r.juicio === 'APROBADO').length;
            existingApr.noAprobados = existingApr.raps.filter(r => r.juicio === 'NO APROBADO').length;
            existingApr.pendientes = existingApr.raps.filter(r => r.juicio === 'POR EVALUAR').length;
            existingApr.totalRaps = existingApr.raps.length;
          } else {
            aprendicesNuevos++;
            learnersMap.set(inApr.numDoc, inApr);
            juiciosNuevosAprobados += inApr.aprobados;
          }
        });

        const updatedLearners = Array.from(learnersMap.values());
        const historial = f.historialCargues || [];
        const consecutivo = historial.length + 1;

        const nuevoRegistroCargue = {
          id: generateUUID(),
          numeroCargue: consecutivo,
          filename: parsed.meta.filename || 'Reporte_Juicios_SOFIA.xlsx',
          fechaReporte: parsed.meta.fechaReporte || 'N/A',
          fechaCargue: timestampActual,
          totalFilasExcel: parsed.totalFilasExcel,
          totalAprendicesAfectados: parsed.totalAprendicesUnicos,
          aprendicesNuevos,
          aprendicesActualizados,
          juiciosNuevosAprobados,
          juiciosActualizados,
          subidoPor: 'Carlos Julio Cadena (Instructor)',
          observacion: `Actualización SOFIA: ${aprendicesNuevos} nuevos aprendices, ${aprendicesActualizados} actualizados.`
        };

        const consolidadoJuicios = [];
        updatedLearners.forEach(apr => {
          (apr.raps || []).forEach(r => {
            consolidadoJuicios.push({
              tipoDoc: apr.tipoDoc,
              numDoc: apr.numDoc,
              nombre: apr.nombre,
              apellidos: apr.apellidos,
              estadoApr: apr.estado,
              competencia: r.competencia,
              rap: r.rap,
              juicio: r.juicio,
              fechaHoraJuicio: r.fechaHora,
              funcionario: r.funcionario
            });
          });
        });

        return {
          ...f,
          programa: parsed.meta.denominacion || f.programa,
          centro: parsed.meta.centro || f.centro,
          regional: parsed.meta.regional || f.regional,
          aprendices: updatedLearners,
          juicios: consolidadoJuicios,
          historialCargues: [nuevoRegistroCargue, ...historial],
          reportes: [nuevoRegistroCargue, ...(f.reportes || [])]
        };
      }
      return f;
    });

    setFichas(updatedFichas);
    saveFichas(updatedFichas);
    setPreviewParsedData(null);
    setLastUploadedFile(null);
    showToast(`Cargue procesado: ${parsed.totalAprendicesUnicos} aprendices únicos actualizados (${parsed.totalFilasExcel} filas deduplicadas).`);
  };

  return (
    <div>
      {/* Header Institucional */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="logo-box">
              <i className="ph ph-graduation-cap"></i>
            </div>
            <div>
              <h1>Sistema de Control de Instructores</h1>
              <span className="subtext">SENA — CIES Regional Huila | Centro de Control Académico</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Botón de Copia de Seguridad */}
            <button 
              className="btn btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                padding: '0.4rem 0.85rem', 
                fontSize: '0.82rem', 
                background: '#ffffff', 
                color: '#00324D', 
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={() => setIsBackupModalOpen(true)}
              title="Copias de Seguridad (Exportar / Importar / Respaldos en Servidor)"
            >
              <i className="ph ph-database" style={{ fontSize: '1.1rem', color: '#39A900' }}></i>
              <span>Copia de Seguridad</span>
            </button>

            {/* Botón Rápido: Limpiar Base de Datos para Pruebas */}
            <button 
              className="btn btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                padding: '0.4rem 0.85rem', 
                fontSize: '0.82rem', 
                background: '#fff1f2', 
                color: '#e11d48', 
                border: '1px solid #fecdd3',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={handleCleanDatabaseForTesting}
              title="Limpiar Base de Datos PostgreSQL y Caché para Pruebas"
            >
              <i className="ph ph-trash" style={{ fontSize: '1.1rem', color: '#e11d48' }}></i>
              <span>Limpiar BD (Pruebas)</span>
            </button>

            {/* Acceso Directo a Documentación Swagger UI / OpenAPI 3 */}
            {backendStatus.online && (
              <a 
                href="http://localhost:8080/swagger-ui.html" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem', 
                  padding: '0.4rem 0.85rem', 
                  fontSize: '0.82rem', 
                  background: '#ffffff', 
                  color: '#00324D', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
                title="Abrir documentación Swagger UI interactiva de la API REST"
              >
                <i className="ph ph-brackets-angle" style={{ fontSize: '1.1rem', color: '#0284c7' }}></i>
                <span>Swagger API</span>
              </a>
            )}

            {/* Indicador de Estado del Backend Spring Boot */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                background: backendStatus.online ? '#ecfdf5' : '#fffbeb', 
                border: `1px solid ${backendStatus.online ? '#a7f3d0' : '#fde68a'}`, 
                padding: '0.35rem 0.75rem', 
                borderRadius: '20px', 
                fontSize: '0.78rem' 
              }}
              title={backendStatus.online ? `Conectado a ${backendStatus.info?.backend} con ${backendStatus.info?.database}` : 'Backend fuera de línea. Operando en almacenamiento local del navegador.'}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: backendStatus.online ? '#10b981' : '#f59e0b', display: 'inline-block' }}></span>
              <span style={{ fontWeight: '600', color: backendStatus.online ? '#065f46' : '#92400e' }}>
                {backendStatus.online ? 'Spring Boot 3 + PostgreSQL (Conectado)' : 'Modo Front-end Local'}
              </span>
            </div>

            <div className="user-info">
              <div className="avatar"><i className="ph ph-user"></i></div>
              <div className="user-details">
                <span className="user-name">Carlos Julio Cadena</span>
                <span className="user-role">Instructor Técnico ADSO</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className="main-nav">
        <div className="nav-container">
          <button 
            className={`nav-item ${activeNav === 'fichas' ? 'active' : ''}`}
            onClick={() => handleNavClick('fichas')}
          >
            <i className="ph ph-folders"></i> Fichas de Formación
          </button>
          <button 
            className={`nav-item ${activeNav === 'fichas_detail' ? 'active' : ''}`}
            onClick={() => handleNavClick('reportes')}
          >
            <i className="ph ph-file-arrow-up"></i> Juicios Evaluativos
          </button>
          <button 
            className={`nav-item ${activeNav === 'asistente' ? 'active' : ''}`}
            onClick={() => handleNavClick('asistente')}
          >
            <i className="ph ph-sparkle"></i> Asistente IA Reglamento
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {activeNav === 'fichas' && (
          <FichasView 
            fichas={fichas}
            onSelectFicha={handleSelectFicha}
            onOpenNewModal={() => setIsFichaModalOpen(true)}
          />
        )}

        {activeNav === 'fichas_detail' && (
          <FichaDetailView 
            ficha={currentFicha}
            onBack={handleBackToFichas}
            onExcelUpload={handleExcelUpload}
            onSaveProjectReport={handleSaveProjectReport}
          />
        )}

        {activeNav === 'asistente' && (
          <AsistenteView />
        )}
      </main>

      {/* Modales */}
      <FichaModal 
        isOpen={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
        onSave={handleSaveFicha}
        fichas={fichas}
      />

      <PreviewReportModal 
        isOpen={!!previewParsedData}
        parsedData={previewParsedData}
        onClose={() => setPreviewParsedData(null)}
        onConfirm={handleConfirmImport}
      />

      <BackupModal 
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreSuccess={handleBackupRestoreSuccess}
        fichas={fichas}
        isBackendOnline={backendStatus.online}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <i className="ph ph-check-circle toast-icon"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
