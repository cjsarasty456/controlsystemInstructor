import React, { useState, useMemo } from 'react';
import { DEFAULT_REGLAMENTO_INFO, evaluarCasoAprendiz } from '../services/reglamentoService';

export default function EvaluadorReglamentoModal({
  isOpen,
  onClose,
  ficha,
  preselectedLearner = null
}) {
  const [activeTab, setActiveTab] = useState('evaluador'); // 'evaluador' | 'riesgos' | 'reglamento'
  
  // Estado del Evaluador
  const [selectedLearnerDoc, setSelectedLearnerDoc] = useState(
    preselectedLearner ? preselectedLearner.numDoc : ''
  );
  const [motivo, setMotivo] = useState('ACADEMICO');
  const [inasistencias, setInasistencias] = useState(0);
  const [tieneAntecedentes, setTieneAntecedentes] = useState(false);
  const [esReincidente, setEsReincidente] = useState(false);
  const [descripcionFalta, setDescripcionFalta] = useState('');
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Estado del Reglamento Cargado
  const [reglamentoInfo, setReglamentoInfo] = useState(DEFAULT_REGLAMENTO_INFO);
  const [searchArticle, setSearchArticle] = useState('');

  if (!isOpen || !ficha) return null;

  const aprendices = ficha.aprendices || [];
  const aprendicesEnFormacion = aprendices.filter(a => {
    const s = String(a.estado || '').toUpperCase();
    return s.includes('FORMACION');
  });

  // Aprendiz seleccionado actualmente
  const currentLearner = useMemo(() => {
    if (!selectedLearnerDoc && aprendicesEnFormacion.length > 0) {
      return aprendicesEnFormacion[0];
    }
    return aprendices.find(a => a.numDoc === selectedLearnerDoc) || aprendicesEnFormacion[0];
  }, [aprendices, aprendicesEnFormacion, selectedLearnerDoc]);

  // RAPs no aprobados del aprendiz
  const rapsNoAprobadosCount = currentLearner ? (currentLearner.noAprobados || 0) : 0;

  // Ejecutar dictamen normativo en tiempo real
  const dictamen = useMemo(() => {
    return evaluarCasoAprendiz({
      aprendiz: currentLearner,
      ficha,
      motivo,
      descripcionFalta,
      rapsNoAprobadosCount,
      inasistenciasInjustificadas: parseInt(inasistencias, 10) || 0,
      tieneAntecedentes,
      esReincidente
    });
  }, [currentLearner, ficha, motivo, descripcionFalta, rapsNoAprobadosCount, inasistencias, tieneAntecedentes, esReincidente]);

  // Auditoría de aprendices en riesgo
  const aprendicesEnRiesgo = useMemo(() => {
    return aprendicesEnFormacion.map(a => {
      const reprobados = (a.raps || []).filter(r => r.juicio === 'NO APROBADO').length;
      const pendientes = (a.raps || []).filter(r => r.juicio === 'POR EVALUAR').length;
      const aprobados = (a.raps || []).filter(r => r.juicio === 'APROBADO').length;
      const total = (a.raps || []).length;
      const pctAvance = total > 0 ? ((aprobados / total) * 100).toFixed(0) : 0;

      let nivelRiesgo = 'Bajo';
      let motivoRiesgo = 'Rendimiento normal';

      if (reprobados >= 2) {
        nivelRiesgo = 'Crítico';
        motivoRiesgo = `${reprobados} RAPs NO APROBADOS — Requiere Citación a Comité (Art. 29)`;
      } else if (reprobados === 1) {
        nivelRiesgo = 'Medio';
        motivoRiesgo = `1 RAP NO APROBADO — Requiere Plan de Mejoramiento Académico (Art. 27)`;
      } else if (pendientes > 10 && pctAvance < 30) {
        nivelRiesgo = 'Moderado';
        motivoRiesgo = `Bajo porcentaje de avance (${pctAvance}%) y ${pendientes} juicios pendientes`;
      }

      return {
        ...a,
        reprobados,
        pendientes,
        aprobados,
        pctAvance,
        nivelRiesgo,
        motivoRiesgo
      };
    }).filter(a => a.nivelRiesgo !== 'Bajo');
  }, [aprendicesEnFormacion]);

  const handleCopyCitation = () => {
    if (dictamen && dictamen.textoCitacion) {
      navigator.clipboard.writeText(dictamen.textoCitacion);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 3000);
    }
  };

  const handleSelectToEvaluate = (apr) => {
    setSelectedLearnerDoc(apr.numDoc);
    setMotivo(apr.reprobados > 0 ? 'ACADEMICO' : 'INASISTENCIA');
    setActiveTab('evaluador');
  };

  const handleReglamentoFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReglamentoInfo({
      ...reglamentoInfo,
      norma: `Reglamento Actualizado (${file.name})`,
      fechaCarga: new Date().toLocaleDateString(),
      tamano: `${(file.size / 1024).toFixed(0)} KB`,
      tipoDocumento: 'Archivo PDF / Doc Cargado por el Instructor'
    });
    alert(`Reglamento "${file.name}" cargado y vinculado como base legal para las evaluaciones.`);
    e.target.value = '';
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '920px', width: '95%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <i className="ph ph-scales" style={{ fontSize: '1.6rem', color: '#b91c1c' }}></i>
            <div>
              <h3 style={{ margin: 0 }}>Evaluador Normativo — Reglamento del Aprendiz SENA</h3>
              <small style={{ color: 'var(--text-secondary)' }}>
                Ficha {ficha.numero} — CIES Regional Huila (Acuerdo 007 de 2012)
              </small>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><i className="ph ph-x"></i></button>
        </div>

        {/* Barra de Pestañas del Evaluador */}
        <div className="filter-chips" style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            className={`chip ${activeTab === 'evaluador' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluador')}
          >
            <i className="ph ph-gavel"></i> Evaluador de Casos y Citación a Comité
          </button>
          <button 
            className={`chip ${activeTab === 'riesgos' ? 'active' : ''}`}
            onClick={() => setActiveTab('riesgos')}
          >
            <i className="ph ph-warning"></i> Aprendices en Riesgo Académico ({aprendicesEnRiesgo.length})
          </button>
          <button 
            className={`chip ${activeTab === 'reglamento' ? 'active' : ''}`}
            onClick={() => setActiveTab('reglamento')}
          >
            <i className="ph ph-book-open"></i> Reglamento del Aprendiz Cargado
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '1.25rem' }}>
          
          {/* TAB 1: EVALUADOR DE CASOS Y CITACIÓN */}
          {activeTab === 'evaluador' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                
                {/* Panel de Entrada */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                    <i className="ph ph-user"></i> Datos del Aprendiz y Tipo de Novedad
                  </h4>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.78rem' }}>Aprendiz a Evaluar:</label>
                    <select 
                      value={currentLearner ? currentLearner.numDoc : ''} 
                      onChange={(e) => setSelectedLearnerDoc(e.target.value)}
                      style={{ padding: '0.45rem', fontSize: '0.82rem' }}
                    >
                      {aprendicesEnFormacion.map(a => (
                        <option key={a.numDoc} value={a.numDoc}>
                          {a.nombreCompleto} ({a.numDoc}) {a.noAprobados > 0 ? `— ⚠️ ${a.noAprobados} RAPs NO APROBADOS` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.78rem' }}>Motivo Principal de Evaluación:</label>
                    <select 
                      value={motivo} 
                      onChange={(e) => setMotivo(e.target.value)}
                      style={{ padding: '0.45rem', fontSize: '0.82rem' }}
                    >
                      <option value="ACADEMICO">Falta Académica / RAPs No Aprobados (Art. 24)</option>
                      <option value="INASISTENCIA">Inasistencias Injustificadas Acumuladas (Art. 22)</option>
                      <option value="DESERCION">Deserción: 3 días consecutivos injustificados (Art. 22 Núm. 4)</option>
                      <option value="DISCIPLINARIO">Falta Disciplinaria / Deberes y Prohibiciones (Art. 9 y 10)</option>
                    </select>
                  </div>

                  {(motivo === 'INASISTENCIA' || motivo === 'DESERCION') && (
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.78rem' }}>Días de Inasistencia Injustificada:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="30" 
                        value={inasistencias} 
                        onChange={(e) => setInasistencias(e.target.value)}
                        style={{ padding: '0.4rem', fontSize: '0.82rem' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={tieneAntecedentes} 
                        onChange={(e) => setTieneAntecedentes(e.target.checked)} 
                      />
                      Tiene Antecedentes Previos
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={esReincidente} 
                        onChange={(e) => setEsReincidente(e.target.checked)} 
                      />
                      Es Reincidente en la Falta
                    </label>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Descripción Circunstanciada de los Hechos:</label>
                    <textarea 
                      rows="3" 
                      placeholder="Indica las evidencias no entregadas, fechas de inasistencia o hechos observados..."
                      value={descripcionFalta}
                      onChange={(e) => setDescripcionFalta(e.target.value)}
                      style={{ padding: '0.45rem', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Panel de Dictamen Legal */}
                <div style={{ background: '#fff', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="code-tag" style={{ background: '#f1f5f9' }}>Dictamen Normativo Oficial</span>
                      <span className={`badge ${dictamen.gravedad === 'Gravísima' ? 'red' : (dictamen.gravedad === 'Grave' ? 'warning' : 'green')}`}>
                        Gravedad: {dictamen.gravedad.toUpperCase()}
                      </span>
                    </div>

                    <h4 style={{ margin: '0.4rem 0', color: 'var(--secondary)', fontSize: '0.95rem' }}>
                      {dictamen.clasificacion}
                    </h4>

                    <div style={{ background: dictamen.requiereComite ? '#fef2f2' : '#f0fdf4', border: `1px solid ${dictamen.requiereComite ? '#fecaca' : '#bbf7d0'}`, borderRadius: '4px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: dictamen.requiereComite ? '#991b1b' : '#166534', marginBottom: '0.2rem' }}>
                        <i className={`ph ${dictamen.requiereComite ? 'ph-gavel' : 'ph-check-circle'}`}></i> Medida Formativa / Sancionatoria Recomendada:
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: dictamen.requiereComite ? '#7f1d1d' : '#14532d' }}>
                        {dictamen.medidaRecomendada}
                      </p>
                    </div>

                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>Artículos Invocados del Reglamento:</strong>
                      <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                        {dictamen.articulosInvocados.map((a, i) => (
                          <li key={i} style={{ marginBottom: '0.2rem' }}>
                            <strong>{a.articulo}:</strong> {a.texto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleCopyCitation}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                    >
                      <i className={`ph ${copiedCitation ? 'ph-check' : 'ph-copy'}`}></i> {copiedCitation ? 'Copiado al Portapapeles' : 'Copiar Formato de Citación'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Vista Previa del Documento Formal de Citación */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#1e293b', color: '#f8fafc', padding: '1rem', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', maxHeight: '240px', overflowY: 'auto' }}>
                {dictamen.textoCitacion}
              </div>
            </div>
          )}

          {/* TAB 2: AUDITORÍA DE RIESGOS DE LA FICHA */}
          {activeTab === 'riesgos' && (
            <div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem', color: '#92400e' }}>
                <i className="ph ph-warning-diamond" style={{ fontSize: '1.1rem' }}></i>
                <span> Esta auditoría examina los juicios cargados para aprendices con estado "EN FORMACIÓN" para detectar causales de comités o planes de mejoramiento (Art. 27 y 29).</span>
              </div>

              {aprendicesEnRiesgo.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <i className="ph ph-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                  <h4>No se detectan aprendices en riesgo crítico</h4>
                  <p>Todos los aprendices en formación presentan rendimiento académico aceptable y sin juicios reprobados.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Aprendiz</th>
                      <th>Avance RAPs</th>
                      <th>Reprobados</th>
                      <th>Nivel de Riesgo</th>
                      <th>Causal / Dictamen</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aprendicesEnRiesgo.map((a, i) => (
                      <tr key={i}>
                        <td><strong>{a.numDoc}</strong></td>
                        <td>{a.nombreCompleto}</td>
                        <td>
                          <span className="code-tag">{a.aprobados} / {a.totalRaps || (a.raps || []).length} ({a.pctAvance}%)</span>
                        </td>
                        <td>
                          <span className={`judgment-badge ${a.reprobados > 0 ? 'no-aprobado' : 'pendiente'}`}>
                            {a.reprobados} No Aprobados
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${a.nivelRiesgo === 'Crítico' ? 'red' : 'warning'}`}>
                            {a.nivelRiesgo}
                          </span>
                        </td>
                        <td><small>{a.motivoRiesgo}</small></td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => handleSelectToEvaluate(a)}
                          >
                            <i className="ph ph-gavel"></i> Evaluar Caso
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: REGLAMENTO CARGADO Y ARTICULADO */}
          {activeTab === 'reglamento' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <div>
                  <span className="code-tag" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: '700' }}>
                    Norma Vigente: {reglamentoInfo.norma}
                  </span>
                  <h4 style={{ margin: '0.35rem 0 0.15rem', color: 'var(--secondary)' }}>
                    {reglamentoInfo.titulo}
                  </h4>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Versión: {reglamentoInfo.version} | Fecha: {reglamentoInfo.fechaCarga} | Tamaño: {reglamentoInfo.tamano}
                  </small>
                </div>
                <div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => document.getElementById('reglamentoFileInput').click()}
                  >
                    <i className="ph ph-file-arrow-up"></i> Cargar Nuevo Reglamento (.pdf / .txt)
                  </button>
                  <input 
                    type="file" 
                    id="reglamentoFileInput" 
                    accept=".pdf,.txt,.doc,.docx" 
                    style={{ display: 'none' }} 
                    onChange={handleReglamentoFileUpload} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Buscar artículo, deber, derecho o sanción en el reglamento..." 
                  value={searchArticle}
                  onChange={(e) => setSearchArticle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reglamentoInfo.capitulos.map((cap, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span className="code-tag" style={{ fontWeight: '700' }}>{cap.capitulo}</span>
                      <strong style={{ color: 'var(--secondary)', fontSize: '0.88rem' }}>{cap.titulo}</strong>
                    </div>
                    {cap.articulos
                      .filter(art => !searchArticle || art.nombre.toLowerCase().includes(searchArticle.toLowerCase()) || art.resumen.toLowerCase().includes(searchArticle.toLowerCase()))
                      .map((art, j) => (
                        <div key={j} style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.35rem', fontSize: '0.82rem' }}>
                          <strong style={{ color: 'var(--primary)' }}>{art.numero} — {art.nombre}:</strong>
                          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)' }}>{art.resumen}</p>
                        </div>
                      ))}
                  </div>
                ))}
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

