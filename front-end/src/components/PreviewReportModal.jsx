import React from 'react';

export default function PreviewReportModal({
  isOpen,
  parsedData,
  onClose,
  onConfirm
}) {
  if (!isOpen || !parsedData) return null;

  const { meta, juicios, aprendices, totalFilasExcel } = parsedData;
  const totalJuicios = juicios.length;
  const aprobados = juicios.filter(j => j.juicio === 'APROBADO').length;
  const pendientes = juicios.filter(j => j.juicio === 'POR EVALUAR').length;
  const noAprobados = juicios.filter(j => j.juicio === 'NO APROBADO').length;
  const rapsPromedio = aprendices.length > 0 ? (totalJuicios / aprendices.length).toFixed(0) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg">
        <div className="modal-header">
          <div>
            <h3><i className="ph ph-file-magnifying-glass"></i> Previsualización y Control de Actualización (SOFIA Plus)</h3>
            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '600' }}>
              <i className="ph ph-shield-check"></i> Deduplicación activa: {aprendices.length} aprendices únicos detectados ({rapsPromedio} RAPs/aprendiz)
            </span>
          </div>
          <button className="close-btn" onClick={onClose}><i className="ph ph-x"></i></button>
        </div>
        <div className="modal-body">
          {/* Metadatos extraídos de la cabecera (Filas 1 a 12) */}
          <div className="preview-meta-box">
            <div className="preview-meta-item">
              <span>Ficha de Caracterización</span>
              <span>{meta.numeroFicha || 'Detectada en archivo'}</span>
            </div>
            <div className="preview-meta-item">
              <span>Fecha del Reporte</span>
              <span>{meta.fechaReporte || 'N/A'}</span>
            </div>
            <div className="preview-meta-item">
              <span>Denominación del Programa</span>
              <span>{meta.denominacion || 'N/A'}</span>
            </div>
            <div className="preview-meta-item">
              <span>Centro de Formación</span>
              <span>{meta.centro || 'N/A'}</span>
            </div>
          </div>

          {/* Estadísticas de Extracción y Deduplicación */}
          <div className="preview-stats-row">
            <div className="preview-stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
              <strong style={{ color: 'var(--secondary)' }}>{aprendices.length}</strong>
              <span>Aprendices Únicos (1 por documento)</span>
            </div>
            <div className="preview-stat-card" style={{ borderLeft: '3px solid #10b981' }}>
              <strong style={{ color: '#059669' }}>{aprobados}</strong>
              <span>Juicios Aprobados</span>
            </div>
            <div className="preview-stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
              <strong style={{ color: '#d97706' }}>{pendientes}</strong>
              <span>Por Evaluar / Pendientes</span>
            </div>
            <div className="preview-stat-card" style={{ borderLeft: '3px solid #64748b' }}>
              <strong style={{ color: '#475569' }}>{totalFilasExcel || totalJuicios}</strong>
              <span>Total Filas Excel (1 por RAP)</span>
            </div>
          </div>

          <div className="preview-notice" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
            <i className="ph ph-check-circle" style={{ fontSize: '1.4rem' }}></i>
            <div>
              <strong>Regla de registro único garantizada:</strong>
              <div>El archivo contiene {totalFilasExcel || totalJuicios} filas porque cada aprendiz se lista una vez por cada RAP (~{rapsPromedio} RAPs). El sistema registrará <strong>únicamente {aprendices.length} aprendices</strong> y actualizará el histórico de cada cargue.</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Descartar</button>
          <button type="button" className="btn btn-success" onClick={onConfirm}>
            <i className="ph ph-check"></i> Confirmar y Aplicar Actualización
          </button>
        </div>
      </div>
    </div>
  );
}
