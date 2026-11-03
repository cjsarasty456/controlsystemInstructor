import React, { useState, useMemo } from 'react';
import { getFaseForRapAndCompetencia } from '../services/projectReportService';

const isEnFormacion = (estado) => {
  if (!estado) return false;
  const s = String(estado).toUpperCase().trim();
  return s === 'EN FORMACIÓN' || s === 'EN FORMACION' || s === 'FORMACION' || s === 'FORMACIÓN';
};

export default function FichaDashboardView({
  ficha,
  activeProject,
  onNavigateToTab,
  onOpenReglamentoModal,
  onFilterByFase
}) {
  const [dashboardSortField, setDashboardSortField] = useState('pctAvance');
  const [dashboardSortOrder, setDashboardSortOrder] = useState('asc');

  if (!ficha) return null;

  const aprendices = ficha.aprendices || [];
  const juicios = ficha.juicios || [];

  // 1. Población activa exclusivamente (EN FORMACIÓN)
  const aprendicesEnFormacion = useMemo(() => {
    return aprendices.filter(a => isEnFormacion(a.estado));
  }, [aprendices]);

  const totalEnFormacion = aprendicesEnFormacion.length;
  const totalOtrosEstados = aprendices.length - totalEnFormacion;

  // Mapa de aprendices en formación para filtro rápido
  const docsEnFormacionMap = useMemo(() => {
    const map = new Set();
    aprendicesEnFormacion.forEach(a => map.add(a.numDoc));
    return map;
  }, [aprendicesEnFormacion]);

  // 2. Juicios de aprendices EN FORMACIÓN
  const juiciosActivos = useMemo(() => {
    return juicios.filter(j => docsEnFormacionMap.has(j.numDoc));
  }, [juicios, docsEnFormacionMap]);

  // 3. Totales cuantitativos generales
  const totalJuiciosGeneral = juiciosActivos.length;
  const totalAprobadosGeneral = useMemo(() => {
    return juiciosActivos.filter(j => j.juicio === 'APROBADO').length;
  }, [juiciosActivos]);

  const totalPendientesGeneral = useMemo(() => {
    return juiciosActivos.filter(j => j.juicio === 'POR EVALUAR').length;
  }, [juiciosActivos]);

  const totalNoAprobadosGeneral = useMemo(() => {
    return juiciosActivos.filter(j => j.juicio === 'NO APROBADO').length;
  }, [juiciosActivos]);

  const pctAprobadoGeneral = totalJuiciosGeneral > 0
    ? ((totalAprobadosGeneral / totalJuiciosGeneral) * 100).toFixed(1)
    : '0.0';

  const pctPendienteGeneral = totalJuiciosGeneral > 0
    ? ((totalPendientesGeneral / totalJuiciosGeneral) * 100).toFixed(1)
    : '0.0';

  const pctNoAprobadoGeneral = totalJuiciosGeneral > 0
    ? ((totalNoAprobadosGeneral / totalJuiciosGeneral) * 100).toFixed(1)
    : '0.0';

  // RAPs únicos evaluados
  const totalRapsEvaluados = useMemo(() => {
    const set = new Set();
    juiciosActivos.forEach(j => {
      if (j.rap) set.add(j.rap);
    });
    return set.size;
  }, [juiciosActivos]);

  const totalRapsPrograma = activeProject?.totalRapsRegistrados || 75;

  // 4. Progreso detallado por las 4 Fases Oficiales del Proyecto
  const fasesProgreso = useMemo(() => {
    const fasesDef = [
      { id: 'fase_1', nombre: 'Fase 1: Análisis', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', icon: 'ph-magnifying-glass' },
      { id: 'fase_2', nombre: 'Fase 2: Planeación', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: 'ph-calendar-check' },
      { id: 'fase_3', nombre: 'Fase 3: Ejecución', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: 'ph-code-simple' },
      { id: 'fase_4', nombre: 'Fase 4: Evaluación', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'ph-certificate' }
    ];

    return fasesDef.map(fDef => {
      const juiciosDeFase = juiciosActivos.filter(j => {
        const faseCalculada = getFaseForRapAndCompetencia(j.rap, j.competencia, activeProject);
        return faseCalculada === fDef.nombre;
      });

      const total = juiciosDeFase.length;
      const aprobados = juiciosDeFase.filter(j => j.juicio === 'APROBADO').length;
      const pendientes = juiciosDeFase.filter(j => j.juicio === 'POR EVALUAR').length;
      const noAprobados = juiciosDeFase.filter(j => j.juicio === 'NO APROBADO').length;

      const pctAprobado = total > 0 ? ((aprobados / total) * 100).toFixed(1) : '0.0';
      const pctPendiente = total > 0 ? ((pendientes / total) * 100).toFixed(1) : '0.0';
      const pctNoAprobado = total > 0 ? ((noAprobados / total) * 100).toFixed(1) : '0.0';

      // RAPs únicos en esta fase
      const rapsSet = new Set();
      juiciosDeFase.forEach(j => { if (j.rap) rapsSet.add(j.rap); });

      return {
        ...fDef,
        total,
        aprobados,
        pendientes,
        noAprobados,
        pctAprobado: parseFloat(pctAprobado),
        pctPendiente: parseFloat(pctPendiente),
        pctNoAprobado: parseFloat(pctNoAprobado),
        rapsCount: rapsSet.size
      };
    });
  }, [juiciosActivos, activeProject]);

  // 5. Semáforo y Clasificación Individual de Aprendices
  const aprendicesStats = useMemo(() => {
    return aprendicesEnFormacion.map(apr => {
      const learnerJuicios = juicios.filter(j => j.numDoc === apr.numDoc);
      let total = learnerJuicios.length;
      let aprobados = learnerJuicios.filter(j => j.juicio === 'APROBADO').length;
      let pendientes = learnerJuicios.filter(j => j.juicio === 'POR EVALUAR').length;
      let noAprobados = learnerJuicios.filter(j => j.juicio === 'NO APROBADO').length;

      // Si learnerJuicios está vacío pero apr tiene raps o estadísticas directas:
      if (total === 0 && apr.raps && apr.raps.length > 0) {
        total = apr.raps.length;
        aprobados = apr.raps.filter(r => r.juicio === 'APROBADO').length;
        pendientes = apr.raps.filter(r => r.juicio === 'POR EVALUAR').length;
        noAprobados = apr.raps.filter(r => r.juicio === 'NO APROBADO').length;
      } else if (total === 0 && apr.totalRaps > 0) {
        total = apr.totalRaps;
        aprobados = apr.aprobados || 0;
        pendientes = apr.pendientes || 0;
        noAprobados = apr.noAprobados || 0;
      }
      if (total === 0) total = totalRapsPrograma;
      const pct = total > 0 ? (aprobados / total) * 100 : (apr.pctAprobado || 0);

      let nivel = 'ALTO'; // >= 70%
      if (noAprobados > 0 || pct < 40) {
        nivel = 'CRITICO';
      } else if (pct < 70) {
        nivel = 'MEDIO';
      }

      return {
        ...apr,
        total,
        aprobados,
        pendientes,
        noAprobados,
        pctAvance: pct,
        nivel
      };
    });
  }, [aprendicesEnFormacion, juicios, totalRapsPrograma]);

  const aprendicesDestacados = useMemo(() => aprendicesStats.filter(a => a.nivel === 'ALTO'), [aprendicesStats]);
  const aprendicesMedio = useMemo(() => aprendicesStats.filter(a => a.nivel === 'MEDIO'), [aprendicesStats]);
  const aprendicesEnRiesgo = useMemo(() => aprendicesStats.filter(a => a.nivel === 'CRITICO'), [aprendicesStats]);

  const handleDashboardSort = (field) => {
    if (dashboardSortField === field) {
      setDashboardSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDashboardSortField(field);
      setDashboardSortOrder('asc');
    }
  };

  const sortedAprendicesEnRiesgo = useMemo(() => {
    const list = [...aprendicesEnRiesgo];
    return list.sort((a, b) => {
      let valA = a[dashboardSortField];
      let valB = b[dashboardSortField];

      if (dashboardSortField === 'numDoc') {
        const nA = parseInt(String(valA).replace(/\D/g, ''), 10) || 0;
        const nB = parseInt(String(valB).replace(/\D/g, ''), 10) || 0;
        return dashboardSortOrder === 'asc' ? nA - nB : nB - nA;
      }

      if (dashboardSortField === 'pctAvance' || dashboardSortField === 'noAprobados') {
        return dashboardSortOrder === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      return dashboardSortOrder === 'asc'
        ? valA.localeCompare(valB, 'es', { numeric: true })
        : valB.localeCompare(valA, 'es', { numeric: true });
    });
  }, [aprendicesEnRiesgo, dashboardSortField, dashboardSortOrder]);

  // 6. Análisis de Competencias (Top Aprobadas vs Cuello de Botella)
  const competenciasAnalysis = useMemo(() => {
    const compMap = new Map();

    juiciosActivos.forEach(j => {
      const comp = j.competencia || 'Sin Competencia';
      if (!compMap.has(comp)) {
        compMap.set(comp, { nombre: comp, total: 0, aprobados: 0, pendientes: 0, noAprobados: 0 });
      }
      const data = compMap.get(comp);
      data.total++;
      if (j.juicio === 'APROBADO') data.aprobados++;
      else if (j.juicio === 'POR EVALUAR') data.pendientes++;
      else if (j.juicio === 'NO APROBADO') data.noAprobados++;
    });

    const list = Array.from(compMap.values()).map(c => ({
      ...c,
      pctAprobado: c.total > 0 ? (c.aprobados / c.total) * 100 : 0,
      pctPendiente: c.total > 0 ? (c.pendientes / c.total) * 100 : 0
    }));

    // Top aprobadas
    const topAprobadas = [...list].sort((a, b) => b.pctAprobado - a.pctAprobado).slice(0, 4);

    // Cuello de botella (mayor % pendientes o reprobados)
    const criticas = [...list]
      .filter(c => c.pendientes > 0 || c.noAprobados > 0)
      .sort((a, b) => (b.pendientes + b.noAprobados * 2) - (a.pendientes + a.noAprobados * 2))
      .slice(0, 4);

    return { topAprobadas, criticas };
  }, [juiciosActivos]);

  // Último cargue registrado
  const ultimoCargue = (ficha.historialCargues && ficha.historialCargues.length > 0)
    ? ficha.historialCargues[0]
    : (ficha.reportes && ficha.reportes.length > 0 ? ficha.reportes[0] : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. HERO BANNER: PROGRESO GENERAL DE LA FICHA */}
      <div style={{
        background: 'linear-gradient(135deg, #00324D 0%, #004d73 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(0, 50, 77, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ flex: '1 1 450px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              background: '#39A900',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.78rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <i className="ph ph-check-circle"></i> Ficha Activa {ficha.numero}
            </span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontSize: '0.78rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px'
            }}>
              {ficha.regional || '41 - REGIONAL HUILA'}
            </span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontSize: '0.78rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px'
            }}>
              Proyecto SOFIA: {activeProject?.codigoProyecto || '2417180'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.2rem 0 0.4rem', color: '#ffffff' }}>
            Dashboard de Progreso General
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            Seguimiento curricular consolidado de <strong>{totalEnFormacion} aprendices con estado "EN FORMACIÓN"</strong> sobre el total de RAPs del programa {ficha.programa}.
          </p>
        </div>

        {/* Indicador de Porcentaje General */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '14px',
          padding: '1.25rem 1.75rem',
          textAlign: 'center',
          minWidth: '220px'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
            Avance Global de Juicios
          </span>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#39A900', margin: '0.2rem 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            {pctAprobadoGeneral}%
          </div>
          <span style={{ fontSize: '0.78rem', color: '#e2e8f0', display: 'block' }}>
            {totalAprobadosGeneral} de {totalJuiciosGeneral} juicios aprobados
          </span>
        </div>
      </div>

      {/* 2. CUADRÍCULA DE MÉTRICAS KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* KPI 1: Aprendices Activos */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Aprendices en Formación</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph ph-users" style={{ fontSize: '1.2rem' }}></i>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#00324D' }}>{totalEnFormacion}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            {totalOtrosEstados > 0 ? `${totalOtrosEstados} en otros estados (retirados/cancelados)` : '100% de la ficha activa'}
          </div>
        </div>

        {/* KPI 2: Juicios Aprobados */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Juicios Aprobados</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph ph-check-circle" style={{ fontSize: '1.2rem' }}></i>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>{totalAprobadosGeneral}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            Representa el {pctAprobadoGeneral}% del total de registros
          </div>
        </div>

        {/* KPI 3: Juicios Pendientes */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Por Evaluar / Pendientes</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph ph-clock" style={{ fontSize: '1.2rem' }}></i>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>{totalPendientesGeneral}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            {pctPendienteGeneral}% pendientes de calificación en SOFIA
          </div>
        </div>

        {/* KPI 4: No Aprobados (Alertas) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Juicios No Aprobados</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph ph-warning-octagon" style={{ fontSize: '1.2rem' }}></i>
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: totalNoAprobadosGeneral > 0 ? '#dc2626' : '#10b981' }}>
            {totalNoAprobadosGeneral}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            {totalNoAprobadosGeneral > 0 ? `${totalNoAprobadosGeneral} casos requieren plan de mejora` : 'Sin juicios reprobados'}
          </div>
        </div>

      </div>

      {/* 3. PROGRESO DETALLADO POR LAS 4 FASES DEL PROYECTO */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#00324D', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph ph-tree-structure" style={{ color: '#39A900' }}></i>
              Progreso Curricular por Fases del Proyecto ({activeProject?.codigoProyecto || '2417180'})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Distribución oficial de resultados de aprendizaje según la planeación pedagógica GPFI-F-134
            </span>
          </div>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem' }}
            onClick={() => onNavigateToTab && onNavigateToTab('juicios')}
          >
            <i className="ph ph-arrow-up-right"></i>
            Explorar en Juicios Evaluativos
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {fasesProgreso.map((fp, idx) => (
            <div 
              key={idx}
              style={{
                border: `1px solid ${fp.border}`,
                borderLeft: `5px solid ${fp.color}`,
                background: '#ffffff',
                borderRadius: '10px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <strong style={{ color: '#00324D', fontSize: '0.98rem' }}>{fp.nombre}</strong>
                  <span style={{
                    background: fp.bg,
                    color: fp.color,
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px'
                  }}>
                    {fp.rapsCount} RAPs
                  </span>
                </div>

                {/* Porcentaje de Aprobación de la Fase */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: '800', color: fp.color }}>{fp.pctAprobado}%</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>aprobado</span>
                </div>

                {/* Barra de Progreso Segmentada Tri-color */}
                <div style={{
                  height: '8px',
                  borderRadius: '9999px',
                  background: '#f1f5f9',
                  overflow: 'hidden',
                  display: 'flex',
                  marginBottom: '0.85rem'
                }}>
                  <div 
                    style={{ width: `${fp.pctAprobado}%`, background: '#10b981', transition: 'width 0.4s ease' }} 
                    title={`Aprobados: ${fp.aprobados} (${fp.pctAprobado}%)`}
                  />
                  <div 
                    style={{ width: `${fp.pctPendiente}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} 
                    title={`Por Evaluar: ${fp.pendientes} (${fp.pctPendiente}%)`}
                  />
                  <div 
                    style={{ width: `${fp.pctNoAprobado}%`, background: '#ef4444', transition: 'width 0.4s ease' }} 
                    title={`No Aprobados: ${fp.noAprobados} (${fp.pctNoAprobado}%)`}
                  />
                </div>

                {/* Conteo desglosado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ color: '#059669', fontWeight: '600' }}>✓ {fp.aprobados}</span>
                  <span style={{ color: '#d97706', fontWeight: '600' }}>⏳ {fp.pendientes}</span>
                  <span style={{ color: '#dc2626', fontWeight: '600' }}>✕ {fp.noAprobados}</span>
                </div>
              </div>

              {/* Botón para filtrar en la tabla */}
              <button
                className="btn btn-secondary"
                style={{
                  marginTop: '1rem',
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.65rem',
                  width: '100%',
                  justifyContent: 'center',
                  borderColor: fp.border,
                  color: fp.color
                }}
                onClick={() => onFilterByFase && onFilterByFase(fp.nombre)}
              >
                Filtrar juicios de {fp.nombre.split(':')[0]}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SEMÁFORO ACADÉMICO Y ALERTA TEMPRANA DE APRENDICES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* Distribución del Semáforo */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 0.3rem', color: '#00324D', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ph ph-gauge" style={{ color: '#0284c7' }}></i>
            Semáforo de Rendimiento
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '1.25rem' }}>
            Clasificación sobre {totalEnFormacion} aprendices activos
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* Nivel Alto */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#065f46', fontSize: '0.85rem' }}>
                  🟢 Nivel Destacado / Al Día (&gt; 70%)
                </span>
                <strong style={{ fontSize: '1.1rem', color: '#047857' }}>{aprendicesDestacados.length}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.2rem' }}>
                {totalEnFormacion > 0 ? ((aprendicesDestacados.length / totalEnFormacion) * 100).toFixed(0) : 0}% de los aprendices activos
              </div>
            </div>

            {/* Nivel Medio */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#92400e', fontSize: '0.85rem' }}>
                  🟡 En Progreso (40% - 70%)
                </span>
                <strong style={{ fontSize: '1.1rem', color: '#b45309' }}>{aprendicesMedio.length}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>
                {totalEnFormacion > 0 ? ((aprendicesMedio.length / totalEnFormacion) * 100).toFixed(0) : 0}% con avance intermedio
              </div>
            </div>

            {/* Nivel Crítico */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.85rem' }}>
                  🔴 Atención / En Riesgo (&lt; 40% o No Aprobado)
                </span>
                <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>{aprendicesEnRiesgo.length}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem' }}>
                {aprendicesEnRiesgo.length > 0 ? 'Casos prioritarios para plan de mejoramiento' : 'Excelente: Sin alertas críticas'}
              </div>
            </div>

          </div>
        </div>

        {/* Tabla de Aprendices en Riesgo Académico */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h4 style={{ margin: 0, color: '#00324D', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="ph ph-warning" style={{ color: '#dc2626' }}></i>
                Aprendices que Requieren Seguimiento Pedagógico ({aprendicesEnRiesgo.length})
              </h4>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Identificación temprana según el Reglamento del Aprendiz (Acuerdo 007 de 2012)
              </span>
            </div>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem' }}
              onClick={() => onNavigateToTab && onNavigateToTab('aprendices')}
            >
              <i className="ph ph-users"></i> Ver Todos los Aprendices
            </button>
          </div>

          {aprendicesEnRiesgo.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <i className="ph ph-seal-check" style={{ fontSize: '2.2rem', color: '#10b981' }}></i>
              <strong style={{ color: '#00324D', display: 'block', marginTop: '0.4rem', fontSize: '0.95rem' }}>
                ¡Sin aprendices en estado crítico!
              </strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Todos los aprendices en formación activa mantienen un ritmo de aprobación superior al 40% y sin juicios reprobados.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th 
                      onClick={() => handleDashboardSort('numDoc')}
                      style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', userSelect: 'none' }}
                      title="Ordenar por Documento"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>Documento</span>
                        <i className={`ph ${dashboardSortField === 'numDoc' ? (dashboardSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: dashboardSortField === 'numDoc' ? '#0284c7' : '#94a3b8' }}></i>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleDashboardSort('nombre')}
                      style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', userSelect: 'none' }}
                      title="Ordenar por Aprendiz"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>Aprendiz</span>
                        <i className={`ph ${dashboardSortField === 'nombre' ? (dashboardSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: dashboardSortField === 'nombre' ? '#0284c7' : '#94a3b8' }}></i>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleDashboardSort('pctAvance')}
                      style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', userSelect: 'none' }}
                      title="Ordenar por Avance"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>Avance</span>
                        <i className={`ph ${dashboardSortField === 'pctAvance' ? (dashboardSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: dashboardSortField === 'pctAvance' ? '#0284c7' : '#94a3b8' }}></i>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleDashboardSort('noAprobados')}
                      style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', userSelect: 'none' }}
                      title="Ordenar por No Aprobados"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>No Aprobados</span>
                        <i className={`ph ${dashboardSortField === 'noAprobados' ? (dashboardSortOrder === 'asc' ? 'ph-caret-up' : 'ph-caret-down') : 'ph-arrows-down-up'}`} style={{ color: dashboardSortField === 'noAprobados' ? '#0284c7' : '#94a3b8' }}></i>
                      </div>
                    </th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>Acción Reglamento</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAprendicesEnRiesgo.map((apr, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', fontWeight: '600', color: '#00324D' }}>
                        {apr.numDoc}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', fontWeight: '600' }}>
                        {apr.nombre}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: '700', color: apr.pctAvance < 40 ? '#dc2626' : '#d97706', width: '38px' }}>
                            {apr.pctAvance.toFixed(0)}%
                          </span>
                          <div style={{ flex: 1, minWidth: '60px', height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${apr.pctAvance}%`, height: '100%', background: apr.pctAvance < 40 ? '#ef4444' : '#f59e0b' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        {apr.noAprobados > 0 ? (
                          <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.75rem' }}>
                            {apr.noAprobados} Reprobado{apr.noAprobados > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem',
                            borderColor: '#ef4444',
                            color: '#b91c1c',
                            fontWeight: '600',
                            gap: '0.3rem'
                          }}
                          onClick={() => onOpenReglamentoModal && onOpenReglamentoModal(apr.numDoc)}
                          title="Abrir Evaluador Normativo del Reglamento para este aprendiz"
                        >
                          <i className="ph ph-scales"></i>
                          Evaluar Caso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 5. TOP COMPETENCIAS: MAYOR ÉXITO VS CUELLO DE BOTELLA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Top Competencias Más Aprobadas */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 0.3rem', color: '#00324D', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ph ph-trophy" style={{ color: '#10b981' }}></i>
            Competencias con Mayor Avance
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}>
            Áreas curriculares con mejor tasa de asentamiento de juicios aprobados
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {competenciasAnalysis.topAprobadas.map((c, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 0.9rem', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#00324D', lineHeight: 1.3 }}>
                    {c.nombre}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#059669', flexShrink: 0 }}>
                    {c.pctAprobado.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.pctAprobado}%`, height: '100%', background: '#10b981' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span>{c.aprobados} aprobados</span>
                  <span>{c.total} registros</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competencias Críticas / Cuello de Botella */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 0.3rem', color: '#00324D', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ph ph-hourglass-high" style={{ color: '#d97706' }}></i>
            Competencias Críticas / Cuello de Botella
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}>
            Competencias con mayor volumen de juicios pendientes o no aprobados
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {competenciasAnalysis.criticas.map((c, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 0.9rem', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#00324D', lineHeight: 1.3 }}>
                    {c.nombre}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#d97706', flexShrink: 0 }}>
                    {c.pendientes} pendientes
                  </span>
                </div>
                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.pctPendiente}%`, height: '100%', background: '#f59e0b' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span>{c.noAprobados > 0 ? `${c.noAprobados} no aprobados` : '0 no aprobados'}</span>
                  <span>{c.total} total asignados</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. PIE DE TRAZABILIDAD SOFIA PLUS */}
      {ultimoCargue && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <i className="ph ph-file-arrow-up" style={{ color: '#0284c7', fontSize: '1.2rem' }}></i>
            <span>
              Último cargue: <strong>{ultimoCargue.nombreArchivo || ultimoCargue.nombreArchivoOriginal || 'Reporte SOFIA'}</strong> ({ultimoCargue.fechaReporteSena || 'Fecha no registrada'})
            </span>
          </div>
          <div>
            Responsable: <strong>{ultimoCargue.subidoPor || 'Carlos Julio Cadena'}</strong> | Deduplicación activa en PostgreSQL 18
          </div>
        </div>
      )}

    </div>
  );
}

