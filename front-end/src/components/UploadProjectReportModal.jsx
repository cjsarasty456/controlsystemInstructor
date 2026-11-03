import React, { useState } from 'react';
import { parseProjectReportFile, DEFAULT_ADSO_PROJECT } from '../services/projectReportService';

export default function UploadProjectReportModal({
  isOpen,
  onClose,
  ficha,
  onSaveProjectReport
}) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'upload' | 'preview'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedProject, setParsedProject] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedPhaseId, setExpandedPhaseId] = useState(null);

  if (!isOpen || !ficha) return null;

  // Garantizar objeto de proyecto válido y parseado
  let currentProject = ficha.reporteProyecto || DEFAULT_ADSO_PROJECT;
  if (typeof currentProject === 'string') {
    try {
      currentProject = JSON.parse(currentProject);
    } catch (e) {
      currentProject = DEFAULT_ADSO_PROJECT;
    }
  }
  if (!currentProject || !currentProject.fases) {
    currentProject = DEFAULT_ADSO_PROJECT;
  }

  // Métricas cuantitativas del proyecto activo
  const fasesList = currentProject.fases || DEFAULT_ADSO_PROJECT.fases;
  const totalCompetencias = fasesList.reduce((acc, f) => acc + (f.competencias ? f.competencias.length : 0), 0);
  const totalRaps = fasesList.reduce((acc, f) => {
    if (!f.competencias) return acc;
    return acc + f.competencias.reduce((cAcc, c) => cAcc + (c.raps ? c.raps.length : 0), 0);
  }, 0) || currentProject.totalRapsRegistrados || 75;

  const processFile = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const parsed = await parseProjectReportFile(file);
      setParsedProject(parsed);
      setActiveTab('preview');
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el archivo del reporte del proyecto formativo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleApplyCustomProject = () => {
    if (!parsedProject) return;
    onSaveProjectReport(parsedProject);
    onClose();
  };

  const handleRestoreDefault = () => {
    onSaveProjectReport(DEFAULT_ADSO_PROJECT);
    onClose();
  };

  // Colores y badges por fase institucional
  const getPhaseColorConfig = (index) => {
    const configs = [
      { border: '#0284c7', bg: '#f0f9ff', tagBg: '#e0f2fe', tagColor: '#0369a1', icon: 'ph-magnifying-glass' },
      { border: '#7c3aed', bg: '#f5f3ff', tagBg: '#ede9fe', tagColor: '#6d28d9', icon: 'ph-calendar-check' },
      { border: '#d97706', bg: '#fffbeb', tagBg: '#fef3c7', tagColor: '#b45309', icon: 'ph-code-simple' },
      { border: '#059669', bg: '#ecfdf5', tagBg: '#d1fae5', tagColor: '#047857', icon: 'ph-certificate' }
    ];
    return configs[index % configs.length];
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" style={{ maxWidth: '920px', width: '95%' }}>
        
        {/* Cabecera Institucional del Modal */}
        <div className="modal-header" style={{ background: '#00324D', color: '#ffffff', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(57, 169, 0, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="ph ph-briefcase" style={{ fontSize: '1.5rem', color: '#39A900' }}></i>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: '700' }}>
                Reporte del Proyecto Formativo
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '0.2rem', display: 'block' }}>
                Ficha {ficha.numero} — Planeación Curricular GPFI-F-134 & Reporte SOFIA Plus GFPI-F-016
              </span>
            </div>
          </div>
          <button 
            className="close-btn" 
            onClick={onClose} 
            style={{ color: '#ffffff', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}
            title="Cerrar modal"
          >
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0.5rem 1.5rem 0', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'info' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeTab === 'info' ? '700' : '500',
              color: activeTab === 'info' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <i className="ph ph-squares-four" style={{ fontSize: '1.1rem' }}></i>
            1. Matriz y Fases Activas
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.65rem 1.1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'upload' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeTab === 'upload' ? '700' : '500',
              color: activeTab === 'upload' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <i className="ph ph-upload-simple" style={{ fontSize: '1.1rem' }}></i>
            2. Cargar / Actualizar Reporte
          </button>

          {parsedProject && (
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '0.65rem 1.1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'preview' ? '3px solid #39A900' : '3px solid transparent',
                fontWeight: activeTab === 'preview' ? '700' : '500',
                color: activeTab === 'preview' ? '#00324D' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              <i className="ph ph-eye" style={{ fontSize: '1.1rem' }}></i>
              3. Vista Previa Archivo
            </button>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem', background: '#f8fafc' }}>
          
          {/* TAB 1: MATRIZ Y FASES DEL PROYECTO ACTUAL */}
          {activeTab === 'info' && (
            <div>
              
              {/* Tarjeta Hero del Proyecto Formativo */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: '1 1 500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0'
                      }}>
                        <i className="ph ph-file-text"></i> Código SOFIA: {currentProject.codigoProyecto || '2417180'}
                      </span>
                      <span style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        fontWeight: '600',
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe'
                      }}>
                        Programa: {currentProject.codigoPrograma || '228118'} v.{currentProject.versionPrograma || '1'}
                      </span>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        Actualizado: {currentProject.fechaActualizacion || '16/02/2026'}
                      </span>
                    </div>

                    <h4 style={{ margin: '0.3rem 0 0.4rem', color: '#00324D', fontSize: '1.1rem', fontWeight: '700', lineHeight: 1.35 }}>
                      {currentProject.nombreProyecto}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      Denominación: <strong>{currentProject.programa}</strong> — Origen: <em>{currentProject.origen || 'Planeación Curricular Oficial'}</em>
                    </p>
                  </div>

                  <span className="badge green" style={{ alignSelf: 'flex-start' }}>
                    <i className="ph ph-check-circle"></i> Matriz Activa y Enlazada
                  </span>
                </div>

                {/* KPI métricas de distribución */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  marginTop: '1.1rem',
                  paddingTop: '1.1rem',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#00324D' }}>{fasesList.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Fases Formativas</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0284c7' }}>{totalCompetencias}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Competencias</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#39A900' }}>{totalRaps}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>RAPs Totales</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#7c3aed' }}>100%</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Cobertura Curricular</div>
                  </div>
                </div>
              </div>

              {/* Título de sección de fases */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#00324D', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="ph ph-tree-structure" style={{ color: '#39A900' }}></i>
                  Estructura Oficial de Fases Formativas y Resultados de Aprendizaje:
                </h4>
                <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Haga clic en una fase para inspeccionar competencias y RAPs asociados
                </small>
              </div>

              {/* Grid de las 4 Fases Oficiales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {fasesList.map((fase, i) => {
                  const cfg = getPhaseColorConfig(i);
                  const isExpanded = expandedPhaseId === (fase.id || i);
                  const numCompetencias = fase.competencias ? fase.competencias.length : 0;
                  const numRaps = fase.competencias
                    ? fase.competencias.reduce((sum, c) => sum + (c.raps ? c.raps.length : 0), 0)
                    : 0;

                  return (
                    <div 
                      key={fase.id || i}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${isExpanded ? cfg.border : '#e2e8f0'}`,
                        borderLeft: `5px solid ${cfg.border}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Cabecera de la Tarjeta de Fase */}
                      <div 
                        style={{
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? cfg.bg : '#ffffff'
                        }}
                        onClick={() => setExpandedPhaseId(isExpanded ? null : (fase.id || i))}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: cfg.tagBg,
                            color: cfg.tagColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className={`ph ${cfg.icon}`} style={{ fontSize: '1.2rem' }}></i>
                          </div>
                          <div>
                            <strong style={{ color: '#00324D', fontSize: '0.98rem', display: 'block' }}>
                              {fase.nombre}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {fase.actividades ? `${fase.actividades.length} Actividades de Proyecto` : 'Planeación formativa'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            background: cfg.tagBg,
                            color: cfg.tagColor,
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px'
                          }}>
                            {numCompetencias} Competencias
                          </span>
                          <span style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px'
                          }}>
                            {numRaps} RAPs
                          </span>
                          <i 
                            className={`ph ${isExpanded ? 'ph-caret-up' : 'ph-caret-down'}`} 
                            style={{ color: '#94a3b8', fontSize: '1.1rem', marginLeft: '0.3rem' }}
                          ></i>
                        </div>
                      </div>

                      {/* Contenido desplegable: Actividades y Competencias */}
                      {isExpanded && (
                        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
                          
                          {/* Actividades de Proyecto */}
                          {fase.actividades && fase.actividades.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <strong style={{ fontSize: '0.82rem', color: '#00324D', display: 'block', marginBottom: '0.4rem' }}>
                                <i className="ph ph-check-square"></i> Actividades del Proyecto Formativo (GPFI-F-134):
                              </strong>
                              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                                {fase.actividades.map((act, actIdx) => (
                                  <li key={actIdx} style={{ marginBottom: '0.25rem' }}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Competencias y RAPs vinculados */}
                          {fase.competencias && fase.competencias.length > 0 && (
                            <div>
                              <strong style={{ fontSize: '0.82rem', color: '#00324D', display: 'block', marginBottom: '0.5rem' }}>
                                <i className="ph ph-list-numbers"></i> Competencias y Códigos de Resultados de Aprendizaje:
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {fase.competencias.map((comp, cIdx) => (
                                  <div 
                                    key={cIdx} 
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '6px',
                                      padding: '0.6rem 0.85rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#00324D' }}>
                                        {comp.codigo} — {comp.nombre}
                                      </span>
                                      <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: '700',
                                        padding: '0.15rem 0.45rem',
                                        borderRadius: '4px',
                                        background: comp.tipo === 'Técnica' ? '#e0f2fe' : '#f1f5f9',
                                        color: comp.tipo === 'Técnica' ? '#0369a1' : '#475569'
                                      }}>
                                        {comp.tipo || 'Técnica'}
                                      </span>
                                    </div>
                                    {comp.raps && (
                                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>RAPs:</span>
                                        {comp.raps.map((r, rIdx) => (
                                          <span 
                                            key={rIdx} 
                                            style={{
                                              background: '#f8fafc',
                                              border: '1px solid #cbd5e1',
                                              padding: '0.1rem 0.4rem',
                                              borderRadius: '4px',
                                              fontSize: '0.72rem',
                                              fontFamily: 'monospace',
                                              color: '#0f172a'
                                            }}
                                          >
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón de Restablecer a la Matriz Original Oficial */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleRestoreDefault}
                  title="Restablecer la configuración predeterminada de ADSO (2417180) de Carlos Cadena"
                  style={{ gap: '0.45rem', fontSize: '0.85rem' }}
                >
                  <i className="ph ph-arrow-counter-clockwise"></i>
                  Restablecer Matriz Oficial ADSO (2417180)
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: CARGAR NUEVO REPORTE */}
          {activeTab === 'upload' && (
            <div>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Puede cargar una nueva matriz de Planeación Pedagógica del Proyecto Formativo para actualizar automáticamente las fases, actividades y distribución de RAPs de esta ficha.
              </p>

              {/* Zona Drag and Drop */}
              <div 
                className="upload-dropzone" 
                onClick={() => document.getElementById('projectFileInput').click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: isDragging ? '2px dashed #39A900' : '2px dashed #93c5fd',
                  background: isDragging ? '#f0fdf4' : '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: isDragging ? '#dcfce7' : '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="ph ph-file-arrow-up" style={{ fontSize: '2.2rem', color: isDragging ? '#39A900' : '#2563eb' }}></i>
                </div>
                
                <h3 style={{ margin: '0 0 0.4rem', color: '#00324D', fontSize: '1.15rem' }}>
                  {isDragging ? 'Suelte el archivo aquí' : 'Adjuntar Reporte del Proyecto Formativo'}
                </h3>
                
                <p style={{ maxWidth: '520px', margin: '0.5rem auto 1rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  Arrastra y suelta aquí el formato de Planeación Pedagógica <strong>GPFI-F-134</strong> (.xlsx / .xls) o el Reporte de Proyecto <strong>GFPI-F-016</strong> (.pdf / .json).
                </p>

                <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <span className="format-badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                    <i className="ph ph-file-xls"></i> Excel GPFI-F-134 (.xlsx, .xls)
                  </span>
                  <span className="format-badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    <i className="ph ph-file-pdf"></i> PDF GFPI-F-016 (.pdf)
                  </span>
                  <span className="format-badge" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                    <i className="ph ph-file-code"></i> JSON Estructurado (.json)
                  </span>
                </div>

                <div>
                  <span className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', gap: '0.5rem' }}>
                    <i className="ph ph-folder-open"></i> Explorar Archivo
                  </span>
                </div>

                <input 
                  type="file" 
                  id="projectFileInput" 
                  accept=".xlsx,.xls,.json,.pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
              </div>

              {/* Indicador de procesamiento */}
              {isProcessing && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#39A900', background: '#ffffff', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <i className="ph ph-spinner ph-spin" style={{ fontSize: '2rem' }}></i>
                  <p style={{ marginTop: '0.5rem', fontWeight: '600', color: '#065f46' }}>
                    Analizando y extrayendo fases, competencias y resultados de aprendizaje...
                  </p>
                </div>
              )}

              {/* Mensaje de error */}
              {errorMsg && (
                <div style={{
                  padding: '0.85rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="ph ph-warning-circle" style={{ fontSize: '1.2rem', flexShrink: 0 }}></i>
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VISTA PREVIA DEL ARCHIVO CARGADO */}
          {activeTab === 'preview' && parsedProject && (
            <div>
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '1.25rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                color: '#065f46'
              }}>
                <h4 style={{ margin: '0 0 0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                  <i className="ph ph-check-circle" style={{ fontSize: '1.3rem' }}></i>
                  Reporte del Proyecto Procesado Exitosamente
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Archivo: <strong>{parsedProject.filename || 'Archivo cargado'}</strong> | Código Proyecto: <strong>{parsedProject.codigoProyecto || 'Detectado'}</strong> | RAPs detectados: <strong>{parsedProject.totalRapsRegistrados || '75'}</strong>
                </p>
              </div>

              {/* Fases detectadas */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <strong style={{ color: '#00324D', display: 'block', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                  <i className="ph ph-check-square-offset"></i> Fases curriculares identificadas en el documento:
                </strong>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {(parsedProject.fasesDetectadas || ['Fase 1: Análisis', 'Fase 2: Planeación', 'Fase 3: Ejecución', 'Fase 4: Evaluación']).map((f, i) => (
                    <span 
                      key={i} 
                      style={{
                        background: '#e0e7ff',
                        color: '#3730a3',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe'
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Acciones de confirmación */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setActiveTab('upload')}>
                  Cancelar y Seleccionar Otro
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleApplyCustomProject}
                  style={{ gap: '0.5rem' }}
                >
                  <i className="ph ph-check-circle"></i>
                  Aplicar y Reorganizar Fases de la Ficha
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="modal-footer" style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#64748b' }}>
            <i className="ph ph-shield-check" style={{ color: '#39A900', fontSize: '1.1rem' }}></i>
            <span>Control Curricular Oficial SENA — Regional Huila</span>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.5rem 1.25rem' }}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
