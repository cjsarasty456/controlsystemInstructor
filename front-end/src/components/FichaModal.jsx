import React, { useState } from 'react';

export default function FichaModal({ isOpen, onClose, onSave }) {
  const [numero, setNumero] = useState('');
  const [programa, setPrograma] = useState('ANALISIS Y DESARROLLO DE SOFTWARE');
  const [codigo, setCodigo] = useState('228118');
  const [jornada, setJornada] = useState('PRESENCIAL');
  const [estado, setEstado] = useState('EN EJECUCION');
  const [fechaInicio, setFechaInicio] = useState('2024-12-16');
  const [fechaFin, setFechaFin] = useState('2027-05-07');
  const [regional, setRegional] = useState('41 - REGIONAL HUILA');
  const [centro, setCentro] = useState('9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numero.trim()) {
      alert("Por favor ingresa el número de la ficha.");
      return;
    }
    onSave({
      numero: numero.trim(),
      programa: programa.trim(),
      codigo: codigo.trim() || '228118',
      jornada,
      estado,
      fechaInicio,
      fechaFin,
      regional: regional.trim(),
      centro: centro.trim()
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3><i className="ph ph-plus-circle"></i> Registrar Nueva Ficha</h3>
          <button className="close-btn" onClick={onClose}><i className="ph ph-x"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Número de Ficha *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: 3145556" 
                  pattern="[0-9]{6,10}"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
                <small>De 6 a 10 dígitos numéricos</small>
              </div>
              <div className="form-group flex-1">
                <label>Código Programa</label>
                <input 
                  type="text" 
                  placeholder="Ej: 228118"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Denominación del Programa *</label>
              <input 
                type="text" 
                required 
                placeholder="Ej: ANALISIS Y DESARROLLO DE SOFTWARE"
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Modalidad / Jornada *</label>
                <select value={jornada} onChange={(e) => setJornada(e.target.value)}>
                  <option value="PRESENCIAL">Presencial (Diurna)</option>
                  <option value="MIXTA">Mixta / Nocturna</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="FIN_DE_SEMANA">Fin de semana</option>
                </select>
              </div>
              <div className="form-group flex-1">
                <label>Estado de Caracterización *</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="EN EJECUCION">EN EJECUCION</option>
                  <option value="ETAPA PRODUCTIVA">ETAPA PRODUCTIVA</option>
                  <option value="FINALIZADA">FINALIZADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Fecha de Inicio *</label>
                <input 
                  type="date" 
                  required 
                  value={fechaInicio} 
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Fecha Fin Estimada *</label>
                <input 
                  type="date" 
                  required 
                  value={fechaFin} 
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Regional</label>
                <input 
                  type="text" 
                  value={regional} 
                  onChange={(e) => setRegional(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Centro de Formación</label>
                <input 
                  type="text" 
                  value={centro} 
                  onChange={(e) => setCentro(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              <i className="ph ph-floppy-disk"></i> Guardar Ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

