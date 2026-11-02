import React, { useState, useMemo } from 'react';
import { getFaseForRapAndCompetencia, DEFAULT_ADSO_PROJECT } from '../services/projectReportService';
import { parseSenaDateParts, formatSenaDate } from '../services/dateUtils';
import UploadProjectReportModal from './UploadProjectReportModal';
import EvaluadorReglamentoModal from './EvaluadorReglamentoModal';

// Validar que el aprendiz esté estrictamente "EN FORMACIÓN"
const isEnFormacion = (estado) => {
  if (!estado) return true;
  const s = String(estado).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.includes('FORMACION');
};

export default function FichaDetailView({
  ficha,
  onBack,
  onExcelUpload,
  onSaveProjectReport
}) {
  const [activeTab, setActiveTab] = useState('juicios');
  const [subViewMode, setSubViewMode] = useState('raps'); // 'raps' o 'tabla'
  
  // Estados de los 4 Filtros Solicitados
  const [filterAprendiz, setFilterAprendiz] = useState('TODOS');
  const [filterFase, setFilterFase] = useState('TODAS');
  const [filterCompetencia, setFilterCompetencia] = useState('TODAS');
  const [filterRap, setFilterRap] = useState('TODOS');
  const [filterJuicio, setFilterJuicio] = useState('TODOS');

  // Modales
  const [selectedLearnerModal, setSelectedLearnerModal] = useState(null);
  const [selectedRapDetailModal, setSelectedRapDetailModal] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isReglamentoModalOpen, setIsReglamentoModalOpen] = useState(false);
  const [selectedLearnerForEvaluation, setSelectedLearnerForEvaluation] = useState(null);

  // Estados de Ordenamiento y Búsqueda en Modal de Detalle por RAP
  const [rapDetailSortField, setRapDetailSortField] = useState('nombre');
  const [rapDetailSortOrder, setRapDetailSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [rapDetailSearchText, setRapDetailSearchText] = useState('');
  const [rapDetailJuicioFilter, setRapDetailJuicioFilter] = useState('TODOS');

  // Estados de Ordenamiento en Vista Detalle Fila por Fila
  const [tablaSortField, setTablaSortField] = useState('numDoc');
  const [tablaSortOrder, setTablaSortOrder] = useState('asc');

  // Estados de Ordenamiento en Modal de RAPs del Aprendiz
  const [learnerModalSortField, setLearnerModalSortField] = useState('rap');
  const [learnerModalSortOrder, setLearnerModalSortOrder] = useState('asc');

  // Manejadores de Ordenamiento por Columna
  const handleSortRapDetail = (field) => {
    if (rapDetailSortField === field) {
      setRapDetailSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setRapDetailSortField(field);
      setRapDetailSortOrder('asc');
    }
  };

  const handleSortTabla = (field) => {
    if (tablaSortField === field) {
      setTablaSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTablaSortField(field);
      setTablaSortOrder('asc');
    }
  };

  const handleSortLearnerModal = (field) => {
    if (learnerModalSortField === field) {
      setLearnerModalSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLearnerModalSortField(field);
      setLearnerModalSortOrder('asc');
    }
  };

  // Renderizador estandarizado para campos de fecha de asentamiento / registro
  const renderFechaAsentamiento = (fechaVal) => {
    const { dateStr, timeStr } = parseSenaDateParts(fechaVal);
    if (!dateStr) {
      return (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
          Sin registrar
        </span>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <i className="ph ph-calendar" style={{ color: '#0284c7', fontSize: '0.9rem' }}></i>
          {dateStr}
        </span>
        {timeStr && (
          <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', paddingLeft: '1.25rem' }}>
            <i className="ph ph-clock" style={{ marginRight: '0.2rem' }}></i>
            {timeStr}
          </small>
        )}
      </div>
    );
  };

  const [isDragging, setIsDragging] = useState(false);

  if (!ficha) return null;

  const juicios = ficha.juicios || [];
  const aprendices = ficha.aprendices || [];
  const activeProject = ficha.reporteProyecto || DEFAULT_ADSO_PROJECT;

  // Población de aprendices "EN FORMACIÓN" exclusivamente
  const aprendicesEnFormacion = useMemo(() => {
    return aprendices.filter(a => isEnFormacion(a.estado));
  }, [aprendices]);

  const aprendicesNoActivosCount = aprendices.length - aprendicesEnFormacion.length;
  const totalEnFormacion = aprendicesEnFormacion.length;

  // Información detallada y progreso acumulado del aprendiz seleccionado (si hay filtro activo)
  const selectedLearnerInfo = useMemo(() => {
    if (filterAprendiz === 'TODOS') return null;
    const apr = aprendices.find(a => a.numDoc === filterAprendiz);
    if (!apr) return null;

    // Buscar todos los juicios de este aprendiz (desde apr.raps o de ficha.juicios)
    const learnerJuicios = (apr.raps && apr.raps.length > 0)
      ? apr.raps
      : juicios.filter(j => j.numDoc === apr.numDoc);

    const total = learnerJuicios.length > 0 ? learnerJuicios.length : (activeProject?.totalRapsRegistrados || 75);
    const aprobados = learnerJuicios.filter(r => String(r.juicio || '').toUpperCase().includes('APROBADO') && !String(r.juicio || '').toUpperCase().includes('NO')).length;
    const noAprobados = learnerJuicios.filter(r => String(r.juicio || '').toUpperCase().includes('NO APROBADO') || String(r.juicio || '').toUpperCase().includes('DEFICIENTE')).length;
    const pendientes = learnerJuicios.filter(r => {
      const ju = String(r.juicio || '').toUpperCase();
      return ju.includes('POR EVALUAR') || ju.includes('PENDIENTE') || (!ju.includes('APROBADO'));
    }).length;

    const pctAprobado = total > 0 ? ((aprobados / total) * 100).toFixed(1) : '0.0';
    const pctPendiente = total > 0 ? ((pendientes / total) * 100).toFixed(1) : '0.0';
    const pctNoAprobado = total > 0 ? ((noAprobados / total) * 100).toFixed(1) : '0.0';

    return {
      ...apr,
      total,
      aprobados,
      pendientes,
      noAprobados,
      pctAprobado,
      pctPendiente,
      pctNoAprobado,
      learnerJuicios
    };
  }, [filterAprendiz, aprendices, juicios, activeProject]);

  // Extraer listas únicas para los selectores de filtro
  const uniqueCompetencias = useMemo(() => {
    const set = new Set();
    juicios.forEach(j => { if (j.competencia) set.add(j.competencia); });
    return Array.from(set);
  }, [juicios]);

  const uniqueRaps = useMemo(() => {
    const set = new Set();
    juicios.forEach(j => {
      if (filterCompetencia === 'TODAS' || j.competencia === filterCompetencia) {
        if (j.rap) set.add(j.rap);
      }
    });
    return Array.from(set);
  }, [juicios, filterCompetencia]);

  // Cálculo agrupado por Resultado de Aprendizaje (RAP)
  const rapsMetrics = useMemo(() => {
    if (totalEnFormacion === 0) return [];

    const map = new Map();
    const docEnFormacionSet = new Set(aprendicesEnFormacion.map(a => a.numDoc));

    juicios.forEach(j => {
      // Regla de Negocio: Solo contar aprendices en estado "EN FORMACIÓN"
      if (!docEnFormacionSet.has(j.numDoc)) return;

      // Obtener la Fase Formativa real del RAP y Competencia desde el Proyecto Formativo
      const fase = getFaseForRapAndCompetencia(j.rap, j.competencia, activeProject);

      // Aplicar filtros de búsqueda
      if (filterFase !== 'TODAS' && fase !== filterFase) return;
      if (filterCompetencia !== 'TODAS' && j.competencia !== filterCompetencia) return;
      if (filterRap !== 'TODOS' && j.rap !== filterRap) return;
      if (filterAprendiz !== 'TODOS' && j.numDoc !== filterAprendiz) return;

      const key = `${j.competencia}___${j.rap}`;
      if (!map.has(key)) {
        map.set(key, {
          competencia: j.competencia,
          rap: j.rap,
          fase,
          aprobados: 0,
          pendientes: 0,
          noAprobados: 0,
          aprendicesDetalle: []
        });
      }

      const item = map.get(key);
      const jNormalizado = String(j.juicio || '').toUpperCase();
      let juicioReal = 'POR EVALUAR';
      if (jNormalizado.includes('APROBADO') && !jNormalizado.includes('NO')) {
        juicioReal = 'APROBADO';
      } else if (jNormalizado.includes('NO APROBADO') || jNormalizado.includes('DEFICIENTE')) {
        juicioReal = 'NO APROBADO';
      }

      item.aprendicesDetalle.push({
        numDoc: j.numDoc,
        nombre: `${j.nombre} ${j.apellidos}`.trim(),
        juicio: juicioReal,
        fechaHora: j.fechaHoraJuicio,
        funcionario: j.funcionario
      });

      if (juicioReal === 'APROBADO') item.aprobados++;
      else if (juicioReal === 'NO APROBADO') item.noAprobados++;
      else item.pendientes++;
    });

    // Calcular porcentajes exactos sobre aprendices "EN FORMACIÓN"
    return Array.from(map.values()).map(r => {
      const denom = filterAprendiz === 'TODOS' ? totalEnFormacion : 1;
      const pctAprobado = denom > 0 ? ((r.aprobados / denom) * 100).toFixed(1) : '0.0';
      const pctPendiente = denom > 0 ? ((r.pendientes / denom) * 100).toFixed(1) : '0.0';
      const pctNoAprobado = denom > 0 ? ((r.noAprobados / denom) * 100).toFixed(1) : '0.0';
      return {
        ...r,
        denom,
        pctAprobado,
        pctPendiente,
        pctNoAprobado
      };
    });
  }, [juicios, aprendicesEnFormacion, filterFase, filterCompetencia, filterRap, filterAprendiz, totalEnFormacion, activeProject]);

  // Filtrado de juicios para la tabla detallada (fila por fila)
  const filteredJuiciosTabla = useMemo(() => {
    return juicios.filter(j => {
      const apr = aprendices.find(a => a.numDoc === j.numDoc);
      if (!apr || !isEnFormacion(apr.estado)) return false;

      const fase = getFaseForRapAndCompetencia(j.rap, j.competencia, activeProject);
      if (filterFase !== 'TODAS' && fase !== filterFase) return false;
      if (filterCompetencia !== 'TODAS' && j.competencia !== filterCompetencia) return false;
      if (filterRap !== 'TODOS' && j.rap !== filterRap) return false;
      if (filterAprendiz !== 'TODOS' && j.numDoc !== filterAprendiz) return false;
      if (filterJuicio !== 'TODOS' && j.juicio !== filterJuicio) return false;

      return true;
    });
  }, [juicios, aprendices, filterFase, filterCompetencia, filterRap, filterAprendiz, filterJuicio, activeProject]);

  // Aprendices del RAP organizados y filtrados dinámicamente en el modal
  const sortedModalLearners = useMemo(() => {
    if (!selectedRapDetailModal?.aprendicesDetalle) return [];
    
    let list = [...selectedRapDetailModal.aprendicesDetalle];

    // Filtro por Juicio dentro del modal
    if (rapDetailJuicioFilter !== 'TODOS') {
      list = list.filter(a => a.juicio === rapDetailJuicioFilter);
    }

    // Filtro de búsqueda rápida por documento, nombre o funcionario
    if (rapDetailSearchText.trim()) {
      const q = rapDetailSearchText.toLowerCase().trim();
      list = list.filter(a => 
        (a.nombre && a.nombre.toLowerCase().includes(q)) ||
        (a.numDoc && String(a.numDoc).includes(q)) ||
        (a.funcionario && a.funcionario.toLowerCase().includes(q))
      );
    }

    // Ordenamiento por columna
    list.sort((a, b) => {
      const valA = a[rapDetailSortField] || '';
      const valB = b[rapDetailSortField] || '';

      if (rapDetailSortField === 'numDoc') {
        const nA = Number(String(valA).replace(/\D/g, '')) || 0;
        const nB = Number(String(valB).replace(/\D/g, '')) || 0;
        return rapDetailSortOrder === 'asc' ? nA - nB : nB - nA;
      }

      if (rapDetailSortField === 'juicio') {
        const priority = { 'APROBADO': 1, 'POR EVALUAR': 2, 'NO APROBADO': 3 };
        const pA = priority[valA] || 99;
        const pB = priority[valB] || 99;
        if (pA !== pB) {
          return rapDetailSortOrder === 'asc' ? pA - pB : pB - pA;
        }
      }

      if (rapDetailSortField === 'fechaHora') {
        const tA = parseSenaDateParts(valA).timestamp;
        const tB = parseSenaDateParts(valB).timestamp;
        return rapDetailSortOrder === 'asc' ? tA - tB : tB - tA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return rapDetailSortOrder === 'asc'
        ? strA.localeCompare(strB, 'es')
        : strB.localeCompare(strA, 'es');
    });

    return list;
  }, [selectedRapDetailModal, rapDetailSortField, rapDetailSortOrder, rapDetailJuicioFilter, rapDetailSearchText]);

  // Juicios de la tabla fila por fila organizados dinámicamente por columna
  const sortedJuiciosTabla = useMemo(() => {
    let list = [...filteredJuiciosTabla];
    list.sort((a, b) => {
      let valA = a[tablaSortField] || '';
      let valB = b[tablaSortField] || '';

      if (tablaSortField === 'fase') {
        valA = getFaseForRapAndCompetencia(a.rap, a.competencia, activeProject);
        valB = getFaseForRapAndCompetencia(b.rap, b.competencia, activeProject);
      } else if (tablaSortField === 'numDoc') {
        const nA = Number(String(valA).replace(/\D/g, '')) || 0;
        const nB = Number(String(valB).replace(/\D/g, '')) || 0;
        return tablaSortOrder === 'asc' ? nA - nB : nB - nA;
      } else if (tablaSortField === 'juicio') {
        const priority = { 'APROBADO': 1, 'POR EVALUAR': 2, 'NO APROBADO': 3 };
        const pA = priority[valA] || 99;
        const pB = priority[valB] || 99;
        if (pA !== pB) return tablaSortOrder === 'asc' ? pA - pB : pB - pA;
      } else if (tablaSortField === 'fechaHoraJuicio') {
        const tA = parseSenaDateParts(valA).timestamp;
        const tB = parseSenaDateParts(valB).timestamp;
        return tablaSortOrder === 'asc' ? tA - tB : tB - tA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return tablaSortOrder === 'asc'
        ? strA.localeCompare(strB, 'es')
        : strB.localeCompare(strA, 'es');
    });
    return list;
  }, [filteredJuiciosTabla, tablaSortField, tablaSortOrder, activeProject]);

  // RAPs del modal de aprendiz organizados por columna
  const sortedLearnerRaps = useMemo(() => {
    if (!selectedLearnerModal?.raps) return [];
    let list = [...selectedLearnerModal.raps];
    list.sort((a, b) => {
      let valA = a[learnerModalSortField] || '';
      let valB = b[learnerModalSortField] || '';

      if (learnerModalSortField === 'fase') {
        valA = getFaseForRapAndCompetencia(a.rap, a.competencia, activeProject);
        valB = getFaseForRapAndCompetencia(b.rap, b.competencia, activeProject);
      } else if (learnerModalSortField === 'juicio') {
        const priority = { 'APROBADO': 1, 'POR EVALUAR': 2, 'NO APROBADO': 3 };
        const pA = priority[valA] || 99;
        const pB = priority[valB] || 99;
        if (pA !== pB) return learnerModalSortOrder === 'asc' ? pA - pB : pB - pA;
      } else if (learnerModalSortField === 'fechaHora') {
        const tA = parseSenaDateParts(valA).timestamp;
        const tB = parseSenaDateParts(valB).timestamp;
        return learnerModalSortOrder === 'asc' ? tA - tB : tB - tA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return learnerModalSortOrder === 'asc'
        ? strA.localeCompare(strB, 'es')
        : strB.localeCompare(strA, 'es');
    });
    return list;
  }, [selectedLearnerModal, learnerModalSortField, learnerModalSortOrder, activeProject]);

  // Métricas globales
  const globalAprobados = rapsMetrics.reduce((acc, r) => acc + r.aprobados, 0);
  const globalPendientes = rapsMetrics.reduce((acc, r) => acc + r.pendientes, 0);
  const globalNoAprobados = rapsMetrics.reduce((acc, r) => acc + r.noAprobados, 0);
  const totalEvaluacionesActivas = globalAprobados + globalPendientes + globalNoAprobados;
  const pctGlobalAprobado = totalEvaluacionesActivas > 0 ? ((globalAprobados / totalEvaluacionesActivas) * 100).toFixed(1) : '0.0';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onExcelUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onExcelUpload(e.dataTransfer.files[0]);
    }
  };

  const resetAllFilters = () => {
    setFilterAprendiz('TODOS');
    setFilterFase('TODAS');
    setFilterCompetencia('TODAS');
    setFilterRap('TODOS');
    setFilterJuicio('TODOS');
  };

  const openEvaluationForLearner = (apr) => {
    setSelectedLearnerForEvaluation(apr);
    setIsReglamentoModalOpen(true);
  };

  return (
    <section className="view-section active">
      {/* Encabezado del Detalle */}
      <div className="detail-header">
        <button className="btn btn-secondary back-btn" onClick={onBack}>
          <i className="ph ph-arrow-left"></i> Volver a Fichas
        </button>
        <div className="detail-title-box">
          <div className="tag-row">
            <span className={`badge ${ficha.estado.replace(/\s+/g, '.')}`}>{ficha.estado}</span>
            <span className="code-tag">Código: {ficha.codigo} v.{ficha.version || 1}</span>
            <span className="code-tag" style={{ background: '#ecfdf5', color: '#065f46' }}>
              <i className="ph ph-users"></i> {totalEnFormacion} en Formación activa
            </span>
            <span className="code-tag" style={{ background: '#e0e7ff', color: '#3730a3' }}>
              <i className="ph ph-briefcase"></i> Proyecto: {activeProject.codigoProyecto || '2417180'}
            </span>
          </div>
          <h2>Ficha {ficha.numero}</h2>
          <p>{ficha.programa}</p>
        </div>
        <div className="detail-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Botón para Cargar / Consultar Reporte del Proyecto Formativo */}
          <button 
            className="btn btn-secondary" 
            style={{ borderColor: '#6366f1', color: '#4338ca', fontWeight: '600' }}
            onClick={() => setIsProjectModalOpen(true)}
            title="Cargar o consultar la planeación del proyecto formativo oficial"
          >
            <i className="ph ph-briefcase"></i> Reporte del Proyecto
          </button>

          {/* Botón para Evaluar con el Reglamento del Aprendiz */}
          <button 
            className="btn btn-secondary" 
            style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: '600' }}
            onClick={() => { setSelectedLearnerForEvaluation(null); setIsReglamentoModalOpen(true); }}
            title="Evaluar casos, inasistencias y citación a comité según el reglamento"
          >
            <i className="ph ph-scales"></i> Evaluar con Reglamento
          </button>

          {/* Botón Cargar Juicios Excel */}
          <button 
            className="btn btn-success" 
            onClick={() => document.getElementById('excelInputReact').click()}
          >
            <i className="ph ph-microsoft-excel-logo"></i> Cargar Reporte SOFIA Plus (.xls)
          </button>
          <input 
            type="file" 
            id="excelInputReact" 
            accept=".xls,.xlsx" 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
        </div>
      </div>

      {/* Barra de Pestañas */}
      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'juicios' ? 'active' : ''}`}
          onClick={() => setActiveTab('juicios')}
        >
          <i className="ph ph-chart-bar"></i> Juicios Evaluativos por RAP ({rapsMetrics.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'aprendices' ? 'active' : ''}`}
          onClick={() => setActiveTab('aprendices')}
        >
          <i className="ph ph-users"></i> Listado de Aprendices ({aprendices.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <i className="ph ph-info"></i> Información de Caracterización
        </button>
      </div>

      {/* Pestaña: Juicios Evaluativos con Filtros Multidimensionales y Métricas por RAP */}
      {activeTab === 'juicios' && (
        <div className="tab-content active">
          
          {/* Banner Dropzone */}
          <div 
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('excelInputReact').click()}
            style={{ padding: '1.25rem', marginBottom: '1rem' }}
          >
            <i className="ph ph-cloud-arrow-up drop-icon" style={{ fontSize: '2.5rem' }}></i>
            <h3 style={{ fontSize: '1.05rem' }}>Cargar Reporte Excel (.xls / .xlsx) de SOFIA Plus</h3>
            <p style={{ fontSize: '0.82rem' }}>Arrastra el archivo o haz clic para actualizar los juicios evaluativos acumulativos.</p>
          </div>

          {/* BARRA DE FILTROS MULTIDIMENSIONALES (Aprendiz, Fase Oficial del Proyecto, Competencia, RAP) */}
          <div className="action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--secondary)' }}>
                <i className="ph ph-funnel" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}></i>
                <span>Filtros Curriculares por Proyecto Formativo ({activeProject.codigoProyecto})</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  <i className="ph ph-sliders"></i> Ajustar Proyecto
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                  onClick={resetAllFilters}
                >
                  <i className="ph ph-arrow-counter-clockwise"></i> Limpiar Filtros
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {/* Filtro 1: Aprendiz */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <i className="ph ph-user"></i> Aprendiz (EN FORMACIÓN):
                </label>
                <select 
                  value={filterAprendiz} 
                  onChange={(e) => setFilterAprendiz(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                >
                  <option value="TODOS">Todos los aprendices ({totalEnFormacion})</option>
                  {aprendicesEnFormacion.map(a => (
                    <option key={a.numDoc} value={a.numDoc}>
                      {a.nombreCompleto} ({a.numDoc}) {a.noAprobados > 0 ? `⚠️ (${a.noAprobados} Reprobados)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 2: Fase Oficial del Proyecto Formativo */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <i className="ph ph-stack"></i> Fase del Proyecto Formativo:
                </label>
                <select 
                  value={filterFase} 
                  onChange={(e) => { setFilterFase(e.target.value); setFilterCompetencia('TODAS'); setFilterRap('TODOS'); }}
                  style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                >
                  <option value="TODAS">Todas las Fases del Proyecto</option>
                  <option value="Fase 1: Análisis">Fase 1: Análisis</option>
                  <option value="Fase 2: Planeación">Fase 2: Planeación</option>
                  <option value="Fase 3: Ejecución">Fase 3: Ejecución</option>
                  <option value="Fase 4: Evaluación">Fase 4: Evaluación</option>
                </select>
              </div>

              {/* Filtro 3: Competencia */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <i className="ph ph-certificate"></i> Competencia Laboral:
                </label>
                <select 
                  value={filterCompetencia} 
                  onChange={(e) => { setFilterCompetencia(e.target.value); setFilterRap('TODOS'); }}
                  style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                >
                  <option value="TODAS">Todas las Competencias ({uniqueCompetencias.length})</option>
                  {uniqueCompetencias.map((c, i) => (
                    <option key={i} value={c}>
                      {c.length > 55 ? c.substring(0, 52) + '...' : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 4: Resultado de Aprendizaje (RAP) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <i className="ph ph-target"></i> Resultado de Aprendizaje (RAP):
                </label>
                <select 
                  value={filterRap} 
                  onChange={(e) => setFilterRap(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                >
                  <option value="TODOS">Todos los RAPs ({uniqueRaps.length})</option>
                  {uniqueRaps.map((r, i) => (
                    <option key={i} value={r}>
                      {r.length > 60 ? r.substring(0, 57) + '...' : r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aviso de Población Oficial Activa y Proyecto */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#065f46' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="ph ph-check-circle" style={{ fontSize: '1.1rem' }}></i>
                <span>Base del cálculo: <strong>{totalEnFormacion} aprendices con estado "EN FORMACIÓN"</strong>. Proyecto SOFIA: <strong>{activeProject.codigoProyecto}</strong>.</span>
              </div>
              {aprendicesNoActivosCount > 0 && (
                <span style={{ color: '#92400e', background: '#fffbeb', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  <i className="ph ph-warning"></i> Excluidos {aprendicesNoActivosCount} aprendices (cancelados / retiro / traslado)
                </span>
              )}
            </div>
          </div>

          {/* SECCIÓN ESPECIAL: PROGRESO INTEGRAL DEL APRENDIZ SELECCIONADO (CUANDO HAY FILTRO ACTIVO) */}
          {selectedLearnerInfo && (
            <div className="metric-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.85rem', background: '#f8fafc', border: '2px solid #3b82f6', margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span className="code-tag" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: '700' }}>
                    <i className="ph ph-user"></i> Progreso Individual del Aprendiz
                  </span>
                  <h3 style={{ margin: '0.35rem 0 0.15rem', color: 'var(--secondary)' }}>
                    {selectedLearnerInfo.nombreCompleto}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Documento: <strong>{selectedLearnerInfo.tipoDoc || 'CC'} {selectedLearnerInfo.numDoc}</strong> | Estado: <span className="badge green">{selectedLearnerInfo.estado}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ borderColor: '#ef4444', color: '#b91c1c', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => openEvaluationForLearner(selectedLearnerInfo)}
                  >
                    <i className="ph ph-scales"></i> Evaluar según Reglamento
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => setFilterAprendiz('TODOS')}
                  >
                    <i className="ph ph-users"></i> Ver Todos
                  </button>
                </div>
              </div>

              {/* Barra de Progreso Tricolor Funcional del Aprendiz */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#065f46' }}>Avance Acumulado: {selectedLearnerInfo.pctAprobado}% Aprobado</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedLearnerInfo.aprobados} de {selectedLearnerInfo.total} RAPs</span>
                </div>
                <div style={{ display: 'flex', height: '18px', borderRadius: '9px', overflow: 'hidden', background: '#e2e8f0', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                  {parseFloat(selectedLearnerInfo.pctAprobado) > 0 && (
                    <div 
                      style={{ width: `${selectedLearnerInfo.pctAprobado}%`, background: '#10b981', transition: 'width 0.4s ease' }} 
                      title={`Aprobados: ${selectedLearnerInfo.aprobados} (${selectedLearnerInfo.pctAprobado}%)`}
                    />
                  )}
                  {parseFloat(selectedLearnerInfo.pctPendiente) > 0 && (
                    <div 
                      style={{ width: `${selectedLearnerInfo.pctPendiente}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} 
                      title={`Por Evaluar: ${selectedLearnerInfo.pendientes} (${selectedLearnerInfo.pctPendiente}%)`}
                    />
                  )}
                  {parseFloat(selectedLearnerInfo.pctNoAprobado) > 0 && (
                    <div 
                      style={{ width: `${selectedLearnerInfo.pctNoAprobado}%`, background: '#ef4444', transition: 'width 0.4s ease' }} 
                      title={`No Aprobados: ${selectedLearnerInfo.noAprobados} (${selectedLearnerInfo.pctNoAprobado}%)`}
                    />
                  )}
                </div>
              </div>

              {/* Resumen de conteos exactos del aprendiz */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                <span style={{ color: '#065f46', fontWeight: '700' }}>
                  🟢 {selectedLearnerInfo.aprobados} RAPs Aprobados ({selectedLearnerInfo.pctAprobado}%)
                </span>
                <span style={{ color: '#92400e', fontWeight: '700' }}>
                  🟡 {selectedLearnerInfo.pendientes} RAPs Por Evaluar ({selectedLearnerInfo.pctPendiente}%)
                </span>
                <span style={{ color: '#991b1b', fontWeight: '700' }}>
                  🔴 {selectedLearnerInfo.noAprobados} RAPs No Aprobados ({selectedLearnerInfo.pctNoAprobado}%)
                </span>
              </div>
            </div>
          )}

          {/* Conmutador de Vistas: Por RAP con % vs. Tabla Fila por Fila */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="filter-chips">
              <button 
                className={`chip ${subViewMode === 'raps' ? 'active' : ''}`}
                onClick={() => setSubViewMode('raps')}
              >
                <i className="ph ph-chart-pie-slice"></i> Vista por RAP ({rapsMetrics.length})
              </button>
              <button 
                className={`chip ${subViewMode === 'tabla' ? 'active' : ''}`}
                onClick={() => setSubViewMode('tabla')}
              >
                <i className="ph ph-table"></i> Vista Detalle Fila por Fila ({filteredJuiciosTabla.length})
              </button>
            </div>

            {subViewMode === 'tabla' && (
              <div className="filter-group">
                <label>Juicio:</label>
                <select value={filterJuicio} onChange={(e) => setFilterJuicio(e.target.value)}>
                  <option value="TODOS">Todos</option>
                  <option value="APROBADO">Aprobados</option>
                  <option value="PENDIENTE">Por Evaluar</option>
                  <option value="NO APROBADO">No Aprobados</option>
                </select>
              </div>
            )}
          </div>

          {/* VISTA 1: TARJETAS DE MÉTRICAS Y PORCENTAJES POR RESULTADO DE APRENDIZAJE (RAP) */}
          {subViewMode === 'raps' && (
            <div>
              {/* Tarjeta de Resumen Global de los RAPs filtrados (para toda la ficha) */}
              {!selectedLearnerInfo && (
                <div className="stats-overview" style={{ marginBottom: '1.25rem' }}>
                  <div className="stat-pill green">
                    <i className="ph ph-check-circle"></i>
                    <div>
                      <strong>{globalAprobados}</strong>
                      <span>Total Juicios Aprobados</span>
                    </div>
                  </div>
                  <div className="stat-pill yellow">
                    <i className="ph ph-hourglass-medium"></i>
                    <div>
                      <strong>{globalPendientes}</strong>
                      <span>Total Por Evaluar</span>
                    </div>
                  </div>
                  <div className="stat-pill red">
                    <i className="ph ph-x-circle"></i>
                    <div>
                      <strong>{globalNoAprobados}</strong>
                      <span>Total No Aprobados</span>
                    </div>
                  </div>
                  <div className="stat-pill blue">
                    <i className="ph ph-percent"></i>
                    <div>
                      <strong>{pctGlobalAprobado}%</strong>
                      <span>% Aprobación General</span>
                    </div>
                  </div>
                </div>
              )}

              {rapsMetrics.length === 0 ? (
                <div className="empty-state">
                  <i className="ph ph-chart-line-down empty-icon"></i>
                  <h3>No hay juicios evaluativos para los filtros seleccionados</h3>
                  <p>Verifica que existan juicios cargados para aprendices con estado "EN FORMACIÓN".</p>
                  <button className="btn btn-secondary" onClick={resetAllFilters}>
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rapsMetrics.map((r, idx) => (
                    <div 
                      key={idx} 
                      className="metric-card" 
                      style={{ 
                        flexDirection: 'column', 
                        alignItems: 'stretch', 
                        gap: '0.85rem',
                        padding: '1.25rem',
                        borderLeft: r.pctAprobado === '100.0' ? '5px solid #10b981' : (parseFloat(r.pctAprobado) > 60 ? '5px solid #3b82f6' : '5px solid #f59e0b')
                      }}
                    >
                      {/* Cabecera del RAP */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <span className="code-tag" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: '700' }}>
                              <i className="ph ph-folder-open"></i> {r.fase}
                            </span>
                            <span className="code-tag" style={{ maxWidth: '450px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.competencia}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1rem', color: 'var(--secondary)', lineHeight: '1.35' }}>
                            {r.rap}
                          </h4>
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setRapDetailSearchText('');
                            setRapDetailJuicioFilter('TODOS');
                            setRapDetailSortField('nombre');
                            setRapDetailSortOrder('asc');
                            setSelectedRapDetailModal(r);
                          }}
                        >
                          <i className="ph ph-users"></i> Ver {r.aprendicesDetalle.length} Aprendiz{r.aprendicesDetalle.length === 1 ? '' : 'es'}
                        </button>
                      </div>

                      {/* CONDICIONAL: SI SE FILTRÓ POR UN APRENDIZ INDIVIDUAL */}
                      {filterAprendiz !== 'TODOS' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Estado para este aprendiz:</span>
                            <span className={`judgment-badge ${r.aprendicesDetalle[0]?.juicio === 'APROBADO' ? 'aprobado' : (r.aprendicesDetalle[0]?.juicio === 'NO APROBADO' ? 'no-aprobado' : 'pendiente')}`}>
                              {r.aprendicesDetalle[0]?.juicio || 'POR EVALUAR'}
                            </span>
                            {r.aprendicesDetalle[0]?.fechaHora && (
                              <small style={{ color: 'var(--text-muted)' }}>Asentado el: {r.aprendicesDetalle[0].fechaHora}</small>
                            )}
                          </div>
                          {r.aprendicesDetalle[0]?.juicio === 'NO APROBADO' && (
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                              onClick={() => openEvaluationForLearner(selectedLearnerInfo)}
                            >
                              <i className="ph ph-scales"></i> Evaluar Caso
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Barra de Progreso Tricolor Segmentada (Para toda la ficha) */
                        <div>
                          <div>
                            <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: '#e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                              {parseFloat(r.pctAprobado) > 0 && (
                                <div 
                                  style={{ width: `${r.pctAprobado}%`, background: '#10b981', transition: 'width 0.4s ease' }} 
                                  title={`Aprobados: ${r.aprobados} (${r.pctAprobado}%)`}
                                />
                              )}
                              {parseFloat(r.pctPendiente) > 0 && (
                                <div 
                                  style={{ width: `${r.pctPendiente}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} 
                                  title={`Por Evaluar: ${r.pendientes} (${r.pctPendiente}%)`}
                                />
                              )}
                              {parseFloat(r.pctNoAprobado) > 0 && (
                                <div 
                                  style={{ width: `${r.pctNoAprobado}%`, background: '#ef4444', transition: 'width 0.4s ease' }} 
                                  title={`No Aprobados: ${r.noAprobados} (${r.pctNoAprobado}%)`}
                                />
                              )}
                            </div>
                          </div>

                          {/* Fila de Porcentajes y Conteo de Aprendices */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.6rem' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                              <span style={{ color: '#065f46', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <i className="ph ph-check-circle" style={{ color: '#10b981' }}></i>
                                Aprobado: {r.pctAprobado}% <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>({r.aprobados}/{r.denom})</span>
                              </span>
                              <span style={{ color: '#92400e', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <i className="ph ph-hourglass-medium" style={{ color: '#f59e0b' }}></i>
                                Por Evaluar: {r.pctPendiente}% <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>({r.pendientes}/{r.denom})</span>
                              </span>
                              <span style={{ color: '#991b1b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <i className="ph ph-x-circle" style={{ color: '#ef4444' }}></i>
                                No Aprobado: {r.pctNoAprobado}% <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>({r.noAprobados}/{r.denom})</span>
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Población: {r.denom} aprendices EN FORMACIÓN
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: TABLA FILA POR FILA */}
          {subViewMode === 'tabla' && (
            <div className="table-container">
              <div className="table-header-info">
                <div>
                  <h4><i className="ph ph-table"></i> Juicios Evaluativos Extraídos</h4>
                  <small style={{ color: 'var(--text-secondary)' }}>Haz clic en los encabezados para organizar las filas por esa columna</small>
                </div>
                <span>Mostrando {filteredJuiciosTabla.length} de {juicios.length} registros</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSortTabla('fase')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Fase">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Fase</span>
                        <i className={`ph ${tablaSortField === 'fase' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'fase' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('numDoc')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Documento">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Documento</span>
                        <i className={`ph ${tablaSortField === 'numDoc' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'numDoc' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('nombre')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Aprendiz">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Aprendiz</span>
                        <i className={`ph ${tablaSortField === 'nombre' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'nombre' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('competencia')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Competencia">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Competencia Laboral</span>
                        <i className={`ph ${tablaSortField === 'competencia' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'competencia' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('rap')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por RAP">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Resultado de Aprendizaje (RAP)</span>
                        <i className={`ph ${tablaSortField === 'rap' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'rap' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('juicio')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Juicio">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Juicio</span>
                        <i className={`ph ${tablaSortField === 'juicio' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'juicio' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('fechaHoraJuicio')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Fecha Registro">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Fecha Registro</span>
                        <i className={`ph ${tablaSortField === 'fechaHoraJuicio' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'fechaHoraJuicio' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortTabla('funcionario')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Ordenar por Funcionario">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                        <span>Funcionario</span>
                        <i className={`ph ${tablaSortField === 'funcionario' ? (tablaSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: tablaSortField === 'funcionario' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedJuiciosTabla.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No hay juicios que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    sortedJuiciosTabla.slice(0, 100).map((j, i) => {
                      const fase = getFaseForRapAndCompetencia(j.rap, j.competencia, activeProject);
                      const badgeClass = j.juicio === 'APROBADO' ? 'aprobado' : (j.juicio === 'NO APROBADO' ? 'no-aprobado' : 'pendiente');
                      return (
                        <tr key={i}>
                          <td><span className="code-tag">{fase.split(':')[0]}</span></td>
                          <td><strong>{j.numDoc}</strong></td>
                          <td>{j.nombre} {j.apellidos}</td>
                          <td style={{ maxWidth: '220px' }}><small>{j.competencia}</small></td>
                          <td style={{ maxWidth: '280px' }}><small>{j.rap}</small></td>
                          <td><span className={`judgment-badge ${badgeClass}`}>{j.juicio}</span></td>
                          <td>{renderFechaAsentamiento(j.fechaHoraJuicio)}</td>
                          <td><small>{j.funcionario || 'SISTEMA'}</small></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Aprendices Únicos con Barra de Progreso Tricolor Garantizada */}
      {activeTab === 'aprendices' && (
        <div className="tab-content active">
          <div className="table-container">
            <div className="table-header-info">
              <div>
                <h4><i className="ph ph-users-three"></i> Aprendices de la Ficha ({aprendices.length} Registros Únicos)</h4>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Total en Formación: <strong>{totalEnFormacion}</strong> | Excluidos de cálculos: <strong>{aprendicesNoActivosCount}</strong>
                </small>
              </div>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: '#ef4444', color: '#b91c1c' }}
                onClick={() => { setSelectedLearnerForEvaluation(null); setIsReglamentoModalOpen(true); }}
              >
                <i className="ph ph-scales"></i> Auditoría y Citaciones a Comité
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Número de Documento</th>
                  <th>Nombres y Apellidos</th>
                  <th>Estado</th>
                  <th style={{ minWidth: '220px' }}>Progreso de RAPs Aprobados</th>
                  <th>Reprobados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {aprendices.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      No hay aprendices registrados. Carga un reporte Excel de SOFIA Plus para sincronizar la población de la ficha.
                    </td>
                  </tr>
                ) : (
                  aprendices.map((apr, idx) => {
                    // Cálculo Dinámico y Robusto de Métricas por Aprendiz (Evita NaN)
                    const learnerRaps = (apr.raps && apr.raps.length > 0)
                      ? apr.raps
                      : juicios.filter(j => j.numDoc === apr.numDoc);

                    const aprobadosCount = apr.aprobados !== undefined
                      ? apr.aprobados
                      : learnerRaps.filter(r => String(r.juicio || '').toUpperCase().includes('APROBADO') && !String(r.juicio || '').toUpperCase().includes('NO')).length;

                    const noAprobadosCount = apr.noAprobados !== undefined
                      ? apr.noAprobados
                      : learnerRaps.filter(r => String(r.juicio || '').toUpperCase().includes('NO APROBADO') || String(r.juicio || '').toUpperCase().includes('DEFICIENTE')).length;

                    const pendientesCount = apr.pendientes !== undefined
                      ? apr.pendientes
                      : learnerRaps.filter(r => {
                          const ju = String(r.juicio || '').toUpperCase();
                          return ju.includes('POR EVALUAR') || ju.includes('PENDIENTE') || (!ju.includes('APROBADO'));
                        }).length;

                    const totalRaps = learnerRaps.length > 0 
                      ? learnerRaps.length 
                      : (apr.totalRaps || (activeProject?.totalRapsRegistrados || 75));

                    const pctApr = totalRaps > 0 ? Math.round((aprobadosCount / totalRaps) * 100) : 0;
                    const pctPend = totalRaps > 0 ? Math.round((pendientesCount / totalRaps) * 100) : 0;
                    const pctNoApr = totalRaps > 0 ? Math.round((noAprobadosCount / totalRaps) * 100) : 0;
                    const enForm = isEnFormacion(apr.estado);

                    return (
                      <tr key={idx} style={{ background: enForm ? 'transparent' : '#f8fafc', opacity: enForm ? 1 : 0.75 }}>
                        <td><span className="code-tag">{apr.tipoDoc || 'CC'}</span></td>
                        <td><strong>{apr.numDoc}</strong></td>
                        <td><strong>{apr.nombreCompleto}</strong></td>
                        <td>
                          <span className={`badge ${enForm ? 'green' : 'slate'}`}>
                            {apr.estado || 'EN FORMACION'}
                          </span>
                        </td>
                        <td style={{ minWidth: '220px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {/* Barra de Progreso Tricolor Funcional */}
                            <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: '#e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                              {pctApr > 0 && (
                                <div 
                                  style={{ width: `${pctApr}%`, background: '#10b981', transition: 'width 0.3s ease' }} 
                                  title={`Aprobados: ${aprobadosCount} (${pctApr}%)`} 
                                />
                              )}
                              {pctPend > 0 && (
                                <div 
                                  style={{ width: `${pctPend}%`, background: '#f59e0b', transition: 'width 0.3s ease' }} 
                                  title={`Por Evaluar: ${pendientesCount} (${pctPend}%)`} 
                                />
                              )}
                              {pctNoApr > 0 && (
                                <div 
                                  style={{ width: `${pctNoApr}%`, background: '#ef4444', transition: 'width 0.3s ease' }} 
                                  title={`No Aprobados: ${noAprobadosCount} (${pctNoApr}%)`} 
                                />
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '700' }}>
                              <span style={{ color: '#065f46' }}>{aprobadosCount} / {totalRaps} ({pctApr}%)</span>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>{pendientesCount} pendientes</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {noAprobadosCount > 0 ? (
                            <span className="judgment-badge no-aprobado">
                              ⚠️ {noAprobadosCount}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>0</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              onClick={() => setSelectedLearnerModal({
                                ...apr,
                                aprobados: aprobadosCount,
                                pendientes: pendientesCount,
                                noAprobados: noAprobadosCount,
                                totalRaps,
                                raps: learnerRaps
                              })}
                            >
                              <i className="ph ph-list-checks"></i> Ver RAPs ({totalRaps})
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                              onClick={() => openEvaluationForLearner(apr)}
                              title="Evaluar según el Reglamento del Aprendiz"
                            >
                              <i className="ph ph-scales"></i> Evaluar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pestaña: Información de Caracterización */}
      {activeTab === 'info' && (
        <div className="tab-content active">
          <div className="info-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="metric-card">
              <div className="metric-icon green"><i className="ph ph-hash"></i></div>
              <div className="metric-data">
                <span className="metric-number">{ficha.numero}</span>
                <span className="metric-label">Número de Ficha Institucional</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon blue"><i className="ph ph-certificate"></i></div>
              <div className="metric-data">
                <span className="metric-number">{ficha.codigo}</span>
                <span className="metric-label">Código del Programa Formativo</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon orange"><i className="ph ph-map-pin"></i></div>
              <div className="metric-data">
                <span className="metric-number" style={{ fontSize: '1.05rem', lineHeight: '1.3' }}>{ficha.centro}</span>
                <span className="metric-label">{ficha.regional}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon purple"><i className="ph ph-briefcase"></i></div>
              <div className="metric-data">
                <span className="metric-number" style={{ fontSize: '1.05rem' }}>{activeProject.codigoProyecto}</span>
                <span className="metric-label">{activeProject.nombreProyecto}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Desglose de Aprendices de un RAP específico con Ordenamiento por Columna y Formato de Fecha */}
      {selectedRapDetailModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-header">
              <div>
                <h3><i className="ph ph-target"></i> Detalle por Aprendiz del RAP</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedRapDetailModal.fase} | {selectedRapDetailModal.rap}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedRapDetailModal(null)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body">
              {/* Tarjetas de Estadísticas del RAP (Clicables para filtrar rápidamente) */}
              <div className="preview-stats-row" style={{ marginBottom: '1rem' }}>
                <div 
                  className="preview-stat-card"
                  onClick={() => setRapDetailJuicioFilter(prev => prev === 'APROBADO' ? 'TODOS' : 'APROBADO')}
                  style={{ 
                    cursor: 'pointer', 
                    border: rapDetailJuicioFilter === 'APROBADO' ? '2px solid #059669' : '1px solid var(--border)',
                    background: rapDetailJuicioFilter === 'APROBADO' ? '#ecfdf5' : '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                  title="Clic para filtrar solo aprendices con juicio Aprobado"
                >
                  <strong style={{ color: '#059669' }}>{selectedRapDetailModal.aprobados} ({selectedRapDetailModal.pctAprobado}%)</strong>
                  <span>Aprobados {rapDetailJuicioFilter === 'APROBADO' ? '✓' : ''}</span>
                </div>
                <div 
                  className="preview-stat-card"
                  onClick={() => setRapDetailJuicioFilter(prev => prev === 'POR EVALUAR' ? 'TODOS' : 'POR EVALUAR')}
                  style={{ 
                    cursor: 'pointer', 
                    border: rapDetailJuicioFilter === 'POR EVALUAR' ? '2px solid #d97706' : '1px solid var(--border)',
                    background: rapDetailJuicioFilter === 'POR EVALUAR' ? '#fffbeb' : '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                  title="Clic para filtrar solo aprendices con juicio Por Evaluar"
                >
                  <strong style={{ color: '#d97706' }}>{selectedRapDetailModal.pendientes} ({selectedRapDetailModal.pctPendiente}%)</strong>
                  <span>Por Evaluar {rapDetailJuicioFilter === 'POR EVALUAR' ? '✓' : ''}</span>
                </div>
                <div 
                  className="preview-stat-card"
                  onClick={() => setRapDetailJuicioFilter(prev => prev === 'NO APROBADO' ? 'TODOS' : 'NO APROBADO')}
                  style={{ 
                    cursor: 'pointer', 
                    border: rapDetailJuicioFilter === 'NO APROBADO' ? '2px solid #dc2626' : '1px solid var(--border)',
                    background: rapDetailJuicioFilter === 'NO APROBADO' ? '#fef2f2' : '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                  title="Clic para filtrar solo aprendices No Aprobados"
                >
                  <strong style={{ color: '#dc2626' }}>{selectedRapDetailModal.noAprobados} ({selectedRapDetailModal.pctNoAprobado}%)</strong>
                  <span>No Aprobados {rapDetailJuicioFilter === 'NO APROBADO' ? '✓' : ''}</span>
                </div>
              </div>

              {/* Barra de Controles: Filtros Rápidos por Juicio y Buscador */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="filter-chips">
                  <button 
                    className={`chip ${rapDetailJuicioFilter === 'TODOS' ? 'active' : ''}`}
                    onClick={() => setRapDetailJuicioFilter('TODOS')}
                    style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem' }}
                  >
                    Todos ({selectedRapDetailModal.aprendicesDetalle.length})
                  </button>
                  <button 
                    className={`chip ${rapDetailJuicioFilter === 'APROBADO' ? 'active' : ''}`}
                    onClick={() => setRapDetailJuicioFilter('APROBADO')}
                    style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem' }}
                  >
                    🟢 Aprobados ({selectedRapDetailModal.aprobados})
                  </button>
                  <button 
                    className={`chip ${rapDetailJuicioFilter === 'POR EVALUAR' ? 'active' : ''}`}
                    onClick={() => setRapDetailJuicioFilter('POR EVALUAR')}
                    style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem' }}
                  >
                    🟡 Por Evaluar ({selectedRapDetailModal.pendientes})
                  </button>
                  <button 
                    className={`chip ${rapDetailJuicioFilter === 'NO APROBADO' ? 'active' : ''}`}
                    onClick={() => setRapDetailJuicioFilter('NO APROBADO')}
                    style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem' }}
                  >
                    🔴 No Aprobados ({selectedRapDetailModal.noAprobados})
                  </button>
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <input 
                    type="text"
                    placeholder="Buscar documento o nombre..."
                    value={rapDetailSearchText}
                    onChange={(e) => setRapDetailSearchText(e.target.value)}
                    style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.6rem 0.4rem 1.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                  />
                  <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
                </div>
              </div>

              {/* Guía interactiva de ordenamiento por columna */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span><i className="ph ph-info"></i> Haz clic en los encabezados para <strong>organizar por columna</strong> (ascendente / descendente).</span>
                <span>Mostrando {sortedModalLearners.length} de {selectedRapDetailModal.aprendicesDetalle.length} aprendices</span>
              </div>

              {/* Tabla con Encabezados Ordenables y Formato de Fecha Ajustado */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th 
                        onClick={() => handleSortRapDetail('numDoc')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Clic para organizar por Documento"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                          <span>Documento</span>
                          <i 
                            className={`ph ${rapDetailSortField === 'numDoc' ? (rapDetailSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`}
                            style={{ color: rapDetailSortField === 'numDoc' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortRapDetail('nombre')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Clic para organizar por Aprendiz"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                          <span>Aprendiz (EN FORMACIÓN)</span>
                          <i 
                            className={`ph ${rapDetailSortField === 'nombre' ? (rapDetailSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`}
                            style={{ color: rapDetailSortField === 'nombre' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortRapDetail('juicio')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Clic para organizar por Juicio Evaluativo"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                          <span>Juicio Evaluativo</span>
                          <i 
                            className={`ph ${rapDetailSortField === 'juicio' ? (rapDetailSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`}
                            style={{ color: rapDetailSortField === 'juicio' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortRapDetail('fechaHora')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Clic para organizar por Fecha Asentamiento / Registro"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                          <span>Fecha Asentamiento</span>
                          <i 
                            className={`ph ${rapDetailSortField === 'fechaHora' ? (rapDetailSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`}
                            style={{ color: rapDetailSortField === 'fechaHora' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortRapDetail('funcionario')}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Clic para organizar por Funcionario"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem' }}>
                          <span>Funcionario</span>
                          <i 
                            className={`ph ${rapDetailSortField === 'funcionario' ? (rapDetailSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`}
                            style={{ color: rapDetailSortField === 'funcionario' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </th>
                      <th style={{ width: '85px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedModalLearners.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No se encontraron aprendices con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      sortedModalLearners.map((a, i) => {
                        const badgeClass = a.juicio === 'APROBADO' ? 'aprobado' : (a.juicio === 'NO APROBADO' ? 'no-aprobado' : 'pendiente');
                        return (
                          <tr key={i}>
                            <td><strong>{a.numDoc}</strong></td>
                            <td>{a.nombre}</td>
                            <td><span className={`judgment-badge ${badgeClass}`}>{a.juicio}</span></td>
                            <td>{renderFechaAsentamiento(a.fechaHora)}</td>
                            <td><small>{a.funcionario || 'SISTEMA'}</small></td>
                            <td>
                              {a.juicio === 'NO APROBADO' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                                  onClick={() => {
                                    setSelectedRapDetailModal(null);
                                    const aprObj = aprendices.find(apr => apr.numDoc === a.numDoc);
                                    openEvaluationForLearner(aprObj || { numDoc: a.numDoc, nombreCompleto: a.nombre });
                                  }}
                                  title="Evaluar caso según el Reglamento del Aprendiz"
                                >
                                  <i className="ph ph-scales"></i> Evaluar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRapDetailModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Modal de RAPs del Aprendiz con Barra de Progreso Funcional */}
      {selectedLearnerModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-header">
              <div>
                <h3><i className="ph ph-user"></i> Historial de RAPs del Aprendiz</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedLearnerModal.nombreCompleto} — Doc: {selectedLearnerModal.numDoc} ({selectedLearnerModal.estado})
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedLearnerModal(null)}><i className="ph ph-x"></i></button>
            </div>
            <div className="modal-body">
              {/* Barra de progreso destacada en el modal */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#065f46' }}>
                    Progreso: {selectedLearnerModal.totalRaps > 0 ? Math.round(((selectedLearnerModal.aprobados || 0) / selectedLearnerModal.totalRaps) * 100) : 0}% Aprobado
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {selectedLearnerModal.aprobados || 0} de {selectedLearnerModal.totalRaps || 75} RAPs
                  </span>
                </div>
                <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: '#e2e8f0' }}>
                  {selectedLearnerModal.totalRaps > 0 && selectedLearnerModal.aprobados > 0 && (
                    <div style={{ width: `${Math.round((selectedLearnerModal.aprobados / selectedLearnerModal.totalRaps) * 100)}%`, background: '#10b981' }} />
                  )}
                  {selectedLearnerModal.totalRaps > 0 && selectedLearnerModal.pendientes > 0 && (
                    <div style={{ width: `${Math.round((selectedLearnerModal.pendientes / selectedLearnerModal.totalRaps) * 100)}%`, background: '#f59e0b' }} />
                  )}
                  {selectedLearnerModal.totalRaps > 0 && selectedLearnerModal.noAprobados > 0 && (
                    <div style={{ width: `${Math.round((selectedLearnerModal.noAprobados / selectedLearnerModal.totalRaps) * 100)}%`, background: '#ef4444' }} />
                  )}
                </div>
              </div>

              <div className="preview-stats-row" style={{ marginBottom: '1rem' }}>
                <div className="preview-stat-card">
                  <strong style={{ color: '#059669' }}>{selectedLearnerModal.aprobados || 0}</strong>
                  <span>RAPs Aprobados</span>
                </div>
                <div className="preview-stat-card">
                  <strong style={{ color: '#d97706' }}>{selectedLearnerModal.pendientes || 0}</strong>
                  <span>Por Evaluar</span>
                </div>
                <div className="preview-stat-card">
                  <strong style={{ color: '#dc2626' }}>{selectedLearnerModal.noAprobados || 0}</strong>
                  <span>No Aprobados</span>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fase Proyecto</th>
                      <th>Competencia</th>
                      <th>Resultado de Aprendizaje (RAP)</th>
                      <th>Juicio</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedLearnerModal.raps || []).map((r, i) => {
                      const fase = getFaseForRapAndCompetencia(r.rap, r.competencia, activeProject);
                      const badgeClass = r.juicio === 'APROBADO' ? 'aprobado' : (r.juicio === 'NO APROBADO' ? 'no-aprobado' : 'pendiente');
                      return (
                        <tr key={i}>
                          <td><span className="code-tag">{fase.split(':')[0]}</span></td>
                          <td><small>{r.competencia}</small></td>
                          <td><small>{r.rap}</small></td>
                          <td><span className={`judgment-badge ${badgeClass}`}>{r.juicio}</span></td>
                          <td><small>{r.fechaHora || '-'}</small></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="btn btn-secondary" 
                style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                onClick={() => {
                  const targetApr = selectedLearnerModal;
                  setSelectedLearnerModal(null);
                  openEvaluationForLearner(targetApr);
                }}
              >
                <i className="ph ph-scales"></i> Evaluar según Reglamento
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedLearnerModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Carga y Consulta de Reporte del Proyecto Formativo (HU-009) */}
      <UploadProjectReportModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        ficha={ficha}
        onSaveProjectReport={(customProject) => {
          if (onSaveProjectReport) onSaveProjectReport(customProject);
        }}
      />

      {/* MODAL 4: Evaluador Normativo con el Reglamento del Aprendiz (HU-005) */}
      <EvaluadorReglamentoModal 
        isOpen={isReglamentoModalOpen}
        onClose={() => setIsReglamentoModalOpen(false)}
        ficha={ficha}
        preselectedLearner={selectedLearnerForEvaluation}
      />

    </section>
  );
}
