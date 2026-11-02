import React, { useState } from 'react';
import { parseProjectReportFile, DEFAULT_ADSO_PROJECT } from '../services/projectReportService';

export default function UploadProjectReportModal({
  isOpen,
  onClose,
  ficha,
  onSaveProjectReport
}) {
  const [activeTab, setActiveTab] = useState('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedProject, setParsedProject] = useState(null);

  if (!isOpen || !ficha) return null;

  const currentProject = ficha.reporteProyecto || DEFAULT_ADSO_PROJECT;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
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
      e.target.value = '';
    }
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

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <i className="ph ph-briefcase" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
            <div>
              <h3 style={{ margin: 0 }}>Reporte del Proyecto Formativo</h3>
              <small style={{ color: 'var(--text-secondary)' }}>
                Ficha {ficha.numero} — Organización Curricular por Fases y RAPs
              </small>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><i className="ph ph-x"></i></button>
        </div>

        {/* Tabs del Modal */}
        <div className="filter-chips" style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            className={`chip ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="ph ph-info"></i> Proyecto Activo
          </button>
          <button 
            className={`chip ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <i className="ph ph-upload-simple"></i> Cargar Nuevo Reporte (.xlsx / .pdf / .json)
          </button>
          {parsedProject && (
            <button 
              className={`chip ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <i className="ph ph-eye"></i> Vista Previa Archivo
            </button>
          )}
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '1.25rem' }}>
          
          {/* TAB 1: INFO DEL PROYECTO ACTUAL */}
          {activeTab === 'info' && (
            <div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="code-tag" style={{ background: '#ecfdf5', color: '#065f46', fontWeight: '700' }}>
                      Proyecto SOFIA: {currentProject.codigoProyecto || '2417180'}
                    </span>
                    <h4 style={{ margin: '0.4rem 0 0.2rem', color: 'var(--secondary)' }}>
                      {currentProject.nombreProyecto}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Programa: <strong>{currentProject.programa}</strong> (Código: {currentProject.codigoPrograma || '228118'} v.{currentProject.versionPrograma || '1'})
                    </p>
                  </div>
                  <span className="badge green">Activo y Enlazado</span>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--secondary)' }}>
                <i className="ph ph-squares-four"></i> Estructura Oficial de las 4 Fases del Proyecto:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                {(currentProject.fases || DEFAULT_ADSO_PROJECT.fases).map((fase, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{fase.nombre}</strong>
                      <span className="code-tag">{fase.competencias ? fase.competencias.length : '-'} Competencias</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {(fase.actividades || []).map((act, j) => (
                        <li key={j} style={{ marginBottom: '0.25rem' }}>{act}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={handleRestoreDefault}>
                  <i className="ph ph-arrow-counter-clockwise"></i> Restablecer Matriz Oficial ADSO (2417180)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CARGAR NUEVO REPORTE */}
          {activeTab === 'upload' && (
            <div>
              <div 
                className="upload-dropzone" 
                onClick={() => document.getElementById('projectFileInput').click()}
                style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }}
              >
                <i className="ph ph-file-arrow-up drop-icon" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                <h3>Adjuntar Reporte del Proyecto Formativo</h3>
                <p style={{ maxWidth: '480px', margin: '0.5rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Sube el archivo oficial de Planeación Pedagógica <strong>GPFI-F-134</strong> (.xlsx / .xls) o el Reporte de Proyecto <strong>GFPI-F-016</strong> (.pdf / .json).
                </p>
                <span className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  <i className="ph ph-folder-open"></i> Seleccionar Archivo
                </span>
                <input 
                  type="file" 
                  id="projectFileInput" 
                  accept=".xlsx,.xls,.json,.pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
              </div>

              {isProcessing && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--primary)' }}>
                  <i className="ph ph-spinner ph-spin" style={{ fontSize: '1.5rem' }}></i>
                  <p>Extrayendo fases, actividades y resultados de aprendizaje...</p>
                </div>
              )}

              {errorMsg && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.85rem' }}>
                  <i className="ph ph-warning-circle"></i> {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VISTA PREVIA DEL ARCHIVO CARGADO */}
          {activeTab === 'preview' && parsedProject && (
            <div>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', color: '#065f46' }}>
                <h4 style={{ margin: '0 0 0.3rem' }}><i className="ph ph-check-circle"></i> Reporte Procesado Exitosamente</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Archivo: <strong>{parsedProject.filename}</strong> | Código Proyecto: <strong>{parsedProject.codigoProyecto}</strong> | RAPs mapeados: <strong>{parsedProject.totalRapsRegistrados}</strong>
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Fases detectadas en el archivo:</strong>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {(parsedProject.fasesDetectadas || []).map((f, i) => (
                    <span key={i} className="code-tag" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: '700' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setActiveTab('upload')}>
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={handleApplyCustomProject}>
                  <i className="ph ph-check"></i> Aplicar y Reorganizar Fases de la Ficha
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

