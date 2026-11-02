import React, { useState, useEffect } from 'react';
import FichasView from './components/FichasView';
import FichaDetailView from './components/FichaDetailView';
import AsistenteView from './components/AsistenteView';
import FichaModal from './components/FichaModal';
import PreviewReportModal from './components/PreviewReportModal';
import { loadFichas, saveFichas } from './services/storage';
import { parseSenaExcelReport } from './services/excelParser';

export default function App() {
  const [fichas, setFichas] = useState([]);
  const [currentFichaId, setCurrentFichaId] = useState(null);
  const [activeNav, setActiveNav] = useState('fichas');
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [previewParsedData, setPreviewParsedData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loaded = loadFichas();
    setFichas(loaded);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const currentFicha = fichas.find(f => f.id === currentFichaId);

  // Navegación
  const handleSelectFicha = (id) => {
    setCurrentFichaId(id);
    setActiveNav('fichas_detail');
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
  const handleSaveFicha = (newFichaData) => {
    const exists = fichas.find(f => f.numero === newFichaData.numero);
    if (exists) {
      alert(`La ficha número ${newFichaData.numero} ya se encuentra registrada.`);
      return;
    }

    const newFicha = {
      id: 'ficha_' + newFichaData.numero,
      ...newFichaData,
      version: '1',
      aprendices: [],
      historialCargues: [],
      reportes: [],
      juicios: []
    };

    const updated = [newFicha, ...fichas];
    setFichas(updated);
    saveFichas(updated);
    setIsFichaModalOpen(false);
    showToast(`Ficha ${newFichaData.numero} registrada exitosamente.`);
  };

  // Guardar Nuevo Reporte de Proyecto Formativo (HU-009)
  const handleSaveProjectReport = (customProject) => {
    if (!currentFicha) return;
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
      const parsed = await parseSenaExcelReport(file);
      setPreviewParsedData(parsed);
    } catch (err) {
      console.error("Error al procesar el archivo Excel:", err);
      alert("Error al leer el archivo Excel. Asegúrate de que corresponda al reporte oficial de SOFIA Plus.");
    }
  };

  // Confirmar Importación con Deduplicación y Registro de Actualización
  const handleConfirmImport = () => {
    if (!previewParsedData || !currentFicha) return;

    const parsed = previewParsedData;
    const timestampActual = new Date().toLocaleString();

    let juiciosNuevosAprobados = 0;
    let juiciosActualizados = 0;
    let aprendicesNuevos = 0;
    let aprendicesActualizados = 0;

    const updatedFichas = fichas.map(f => {
      if (f.id === currentFicha.id) {
        const learnersMap = new Map();
        
        // Cargar aprendices existentes para comparativa
        (f.aprendices || []).forEach(apr => {
          learnersMap.set(apr.numDoc, { ...apr, raps: [...(apr.raps || [])] });
        });

        // Procesar aprendices deduplicados del nuevo cargue
        parsed.aprendices.forEach(inApr => {
          if (!learnersMap.has(inApr.numDoc)) {
            // Aprendiz nuevo (se registra exactamente 1 vez)
            aprendicesNuevos++;
            learnersMap.set(inApr.numDoc, inApr);
          } else {
            // Aprendiz existente: actualizar datos y RAPs
            aprendicesActualizados++;
            const existing = learnersMap.get(inApr.numDoc);
            existing.tipoDoc = inApr.tipoDoc || existing.tipoDoc;
            existing.nombre = inApr.nombre || existing.nombre;
            existing.apellidos = inApr.apellidos || existing.apellidos;
            existing.nombreCompleto = inApr.nombreCompleto || existing.nombreCompleto;
            existing.estado = inApr.estado || existing.estado;

            // Fusionar o actualizar RAPs
            const existingRapsMap = new Map();
            (existing.raps || []).forEach(r => existingRapsMap.set(r.rap, r));

            inApr.raps.forEach(incomingRap => {
              if (existingRapsMap.has(incomingRap.rap)) {
                const curRap = existingRapsMap.get(incomingRap.rap);
                // Detectar si fue promovido a aprobado
                if (curRap.juicio !== 'APROBADO' && incomingRap.juicio === 'APROBADO') {
                  juiciosNuevosAprobados++;
                  juiciosActualizados++;
                }
                curRap.juicio = incomingRap.juicio;
                curRap.fechaHora = incomingRap.fechaHora || curRap.fechaHora;
                curRap.funcionario = incomingRap.funcionario || curRap.funcionario;
              } else {
                existingRapsMap.set(incomingRap.rap, incomingRap);
                if (incomingRap.juicio === 'APROBADO') juiciosNuevosAprobados++;
              }
            });

            // Recalcular métricas del aprendiz
            const allRaps = Array.from(existingRapsMap.values());
            existing.raps = allRaps;
            existing.totalRaps = allRaps.length;
            existing.aprobados = allRaps.filter(r => r.juicio === 'APROBADO').length;
            existing.pendientes = allRaps.filter(r => r.juicio === 'POR EVALUAR').length;
            existing.noAprobados = allRaps.filter(r => r.juicio === 'NO APROBADO').length;
          }
        });

        const updatedLearners = Array.from(learnersMap.values());

        // Consecutivo del cargue
        const historial = f.historialCargues || [];
        const numeroCargue = historial.length + 1;

        // Registro de Actualización (Auditoría del Cargue)
        const nuevoRegistroCargue = {
          id: 'cargue_' + Date.now(),
          numeroCargue,
          filename: parsed.meta.filename,
          fechaReporte: parsed.meta.fechaReporte,
          fechaCargue: timestampActual,
          totalFilasExcel: parsed.totalFilasExcel,
          totalAprendicesAfectados: parsed.totalAprendicesUnicos,
          aprendicesNuevos,
          aprendicesActualizados,
          juiciosNuevosAprobados,
          totalJuiciosArchivo: parsed.juicios.length,
          subidoPor: 'Carlos Julio Cadena (Instructor)',
          observacion: `Cargue #${numeroCargue} procesado: ${parsed.totalAprendicesUnicos} aprendices únicos, ${juiciosNuevosAprobados} nuevos juicios aprobados.`
        };

        // Recalcular matriz consolidada de juicios
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
    showToast(`Cargue procesado: ${parsed.totalAprendicesUnicos} aprendices únicos actualizados. (${parsed.totalFilasExcel} filas deduplicadas).`);
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
              <span className="subtext">SENA — CIES Regional Huila | Centro de Control Académico (React JS)</span>
            </div>
          </div>
          <div className="user-info">
            <div className="avatar"><i className="ph ph-user"></i></div>
            <div className="user-details">
              <span className="user-name">Carlos Julio Cadena</span>
              <span className="user-role">Instructor Técnico ADSO</span>
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
      />

      <PreviewReportModal 
        isOpen={!!previewParsedData}
        parsedData={previewParsedData}
        onClose={() => setPreviewParsedData(null)}
        onConfirm={handleConfirmImport}
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
