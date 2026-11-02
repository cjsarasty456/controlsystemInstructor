import React, { useState } from 'react';

export default function FichasView({ 
  fichas, 
  onSelectFicha, 
  onOpenNewModal 
}) {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODAS');

  // Cálculo de Métricas
  const totalFichas = fichas.length;
  const totalAprendices = fichas.reduce((acc, f) => acc + (f.aprendices ? f.aprendices.length : 0), 0);
  const fichasActivas = fichas.filter(f => f.estado === 'EN EJECUCION' || f.estado === 'ACTIVA').length;
  const totalReportes = fichas.reduce((acc, f) => acc + (f.reportes ? f.reportes.length : 0), 0);

  // Filtrado de Fichas
  const filteredFichas = fichas.filter(f => {
    const matchEstado = filterEstado === 'TODAS' || f.estado === filterEstado;
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      f.numero.toLowerCase().includes(q) ||
      f.programa.toLowerCase().includes(q) ||
      (f.centro && f.centro.toLowerCase().includes(q));
    return matchEstado && matchSearch;
  });

  return (
    <section className="view-section active">
      {/* Grid de Métricas Globales */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon green"><i className="ph ph-chalkboard-teacher"></i></div>
          <div className="metric-data">
            <span className="metric-number">{totalFichas}</span>
            <span className="metric-label">Fichas Asignadas</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon blue"><i className="ph ph-users-three"></i></div>
          <div className="metric-data">
            <span className="metric-number">{totalAprendices}</span>
            <span className="metric-label">Aprendices Matriculados</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon orange"><i className="ph ph-check-circle"></i></div>
          <div className="metric-data">
            <span className="metric-number">{fichasActivas}</span>
            <span className="metric-label">En Ejecución / Activas</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon purple"><i className="ph ph-files"></i></div>
          <div className="metric-data">
            <span className="metric-number">{totalReportes}</span>
            <span className="metric-label">Reportes SOFIA Procesados</span>
          </div>
        </div>
      </div>

      {/* Barra de Acciones y Filtros */}
      <div className="action-bar">
        <div className="search-box">
          <i className="ph ph-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            placeholder="Buscar por número de ficha, programa o centro..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <i className="ph ph-x"></i>
            </button>
          )}
        </div>

        <div className="filter-chips">
          {['TODAS', 'EN EJECUCION', 'ETAPA PRODUCTIVA', 'FINALIZADA'].map((st) => (
            <button 
              key={st}
              className={`chip ${filterEstado === st ? 'active' : ''}`}
              onClick={() => setFilterEstado(st)}
            >
              {st === 'TODAS' ? 'Todas' : (st === 'EN EJECUCION' ? 'En Ejecución' : (st === 'ETAPA PRODUCTIVA' ? 'Etapa Productiva' : 'Finalizadas'))}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onOpenNewModal}>
          <i className="ph ph-plus-circle"></i> Nueva Ficha
        </button>
      </div>

      {/* Grid de Fichas */}
      {filteredFichas.length === 0 ? (
        <div className="empty-state">
          <i className="ph ph-folder-open empty-icon"></i>
          <h3>No se encontraron fichas</h3>
          <p>No hay fichas que coincidan con el término de búsqueda o filtro seleccionado.</p>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterEstado('TODAS'); }}>
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="fichas-grid">
          {filteredFichas.map((f) => {
            const numAprendices = f.aprendices ? f.aprendices.length : 0;
            const numReportes = f.reportes ? f.reportes.length : 0;
            return (
              <div key={f.id} className="ficha-card" onClick={() => onSelectFicha(f.id)}>
                <div className="ficha-card-header">
                  <div className="ficha-number">
                    <i className="ph ph-folder-notch-open"></i> Ficha {f.numero}
                  </div>
                  <span className={`badge ${f.estado.replace(/\s+/g, '.')}`}>{f.estado}</span>
                </div>
                <div className="ficha-program">{f.programa}</div>
                <div className="ficha-meta">
                  <div className="ficha-meta-item">
                    <i className="ph ph-clock"></i> <span>Modalidad: {f.jornada}</span>
                  </div>
                  <div className="ficha-meta-item">
                    <i className="ph ph-calendar"></i> <span>{f.fechaInicio} al {f.fechaFin}</span>
                  </div>
                  <div className="ficha-meta-item">
                    <i className="ph ph-buildings"></i> <span>{f.regional}</span>
                  </div>
                </div>
                <div className="ficha-card-footer">
                  <div className="learners-count">
                    <i className="ph ph-users"></i> {numAprendices} Aprendices
                    {numReportes > 0 && (
                      <span style={{ marginLeft: '0.5rem', color: '#059669' }}>
                        <i className="ph ph-check"></i> {numReportes} Reportes
                      </span>
                    )}
                  </div>
                  <span className="enter-link">
                    Gestionar <i className="ph ph-arrow-right"></i>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

