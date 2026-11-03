import React, { useState } from 'react';
import { parseProjectReportFile, DEFAULT_ADSO_PROJECT } from '../services/projectReportService';

// Catálogo institucional de programas estándar del SENA (CIES Regional Huila)
const PROGRAMAS_CATALOGO = [
  {
    codigo: '228118',
    nombre: 'ANALISIS Y DESARROLLO DE SOFTWARE',
    version: '1',
    tipoFormacion: 'TITULADA',
    nivel: 'TECNOLOGO',
    horas: 3984
  },
  {
    codigo: '233108',
    nombre: 'PROGRAMACION DE SOFTWARE',
    version: '1',
    tipoFormacion: 'TITULADA',
    nivel: 'TECNICO',
    horas: 2200
  },
  {
    codigo: '228120',
    nombre: 'SEGURIDAD Y GESTION DE BASES DE DATOS',
    version: '1',
    tipoFormacion: 'TITULADA',
    nivel: 'ESPECIALIZACION TECNOLOGICA',
    horas: 880
  },
  {
    codigo: '217300',
    nombre: 'DESARROLLO DE APLICACIONES MOVILES',
    version: '1',
    tipoFormacion: 'TITULADA',
    nivel: 'TECNOLOGO',
    horas: 3984
  },
  {
    codigo: '512200',
    nombre: 'DESARROLLO DE APLICACIONES WEB CON REACT Y JAVASCRIPT',
    version: '1',
    tipoFormacion: 'COMPLEMENTARIA',
    nivel: 'CURSO CORTO',
    horas: 48
  },
  {
    codigo: '512201',
    nombre: 'DESARROLLO DE SERVICIOS REST CON JAVA Y SPRING BOOT',
    version: '1',
    tipoFormacion: 'COMPLEMENTARIA',
    nivel: 'CURSO CORTO',
    horas: 48
  },
  {
    codigo: '512202',
    nombre: 'ADMINISTRACION Y CONSULTA DE BASES DE DATOS POSTGRESQL',
    version: '1',
    tipoFormacion: 'COMPLEMENTARIA',
    nivel: 'CURSO CORTO',
    horas: 40
  }
];

export default function FichaModal({ isOpen, onClose, onSave }) {
  // Navegación por segmentos
  const [activeSegment, setActiveSegment] = useState('caracterizacion'); // 'caracterizacion' | 'programa' | 'curricular'

  // Segmento 1: Datos de la Ficha
  const [numero, setNumero] = useState('');
  const [jornada, setJornada] = useState('PRESENCIAL');
  const [estado, setEstado] = useState('EN EJECUCION');
  const [fechaInicio, setFechaInicio] = useState('2024-12-16');
  const [fechaFin, setFechaFin] = useState('2027-05-07');
  const [regional, setRegional] = useState('41 - REGIONAL HUILA');
  const [centro, setCentro] = useState('9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS');

  // Segmento 2: Selección y Definición del Programa
  const [tipoFormacion, setTipoFormacion] = useState('TITULADA'); // 'TITULADA' | 'COMPLEMENTARIA'
  const [selectedProgramaKey, setSelectedProgramaKey] = useState('228118');
  const [codigoPrograma, setCodigoPrograma] = useState('228118');
  const [nombrePrograma, setNombrePrograma] = useState('ANALISIS Y DESARROLLO DE SOFTWARE');
  const [versionPrograma, setVersionPrograma] = useState('1');
  const [nivelPrograma, setNivelPrograma] = useState('TECNOLOGO');

  // Segmento 3: Diseño Curricular y Proyecto Formativo (Sólo aplica a Titulada)
  const [disenoFile, setDisenoFile] = useState(null);
  const [proyectoOption, setProyectoOption] = useState('default'); // 'default' | 'custom'
  const [proyectoCustom, setProyectoCustom] = useState(null);
  const [proyectoFileName, setProyectoFileName] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorCurricular, setErrorCurricular] = useState('');

  if (!isOpen) return null;

  // Manejador del cambio en el selector de programa
  const handleProgramaChange = (e) => {
    const val = e.target.value;
    setSelectedProgramaKey(val);

    if (val === 'NUEVO') {
      setCodigoPrograma('');
      setNombrePrograma('');
      setVersionPrograma('1');
      setNivelPrograma(tipoFormacion === 'TITULADA' ? 'TECNOLOGO' : 'CURSO CORTO');
      return;
    }

    const prog = PROGRAMAS_CATALOGO.find(p => p.codigo === val);
    if (prog) {
      setCodigoPrograma(prog.codigo);
      setNombrePrograma(prog.nombre);
      setVersionPrograma(prog.version);
      setNivelPrograma(prog.nivel);
      setTipoFormacion(prog.tipoFormacion);
    }
  };

  // Manejador del cambio de Tipo de Formación (Titulada vs Complementaria)
  const handleTipoFormacionChange = (tipo) => {
    setTipoFormacion(tipo);
    if (tipo === 'COMPLEMENTARIA') {
      // Limpiar o anular proyecto y diseño
      setDisenoFile(null);
      setProyectoCustom(null);
      setProyectoFileName('');
    }
  };

  // Carga de archivo de Proyecto Formativo (GPFI-F-134 o GFPI-F-016)
  const handleProyectoFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorCurricular('');
    try {
      const parsed = await parseProjectReportFile(file);
      setProyectoCustom(parsed);
      setProyectoFileName(file.name);
    } catch (err) {
      setErrorCurricular('Error al procesar archivo de proyecto formativo: ' + err.message);
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!numero.trim()) {
      setActiveSegment('caracterizacion');
      alert("Por favor ingrese el número de la ficha.");
      return;
    }

    if (!nombrePrograma.trim() || !codigoPrograma.trim()) {
      setActiveSegment('programa');
      alert("Por favor defina la denominación y código del programa de formación.");
      return;
    }

    // Resolver Proyecto Formativo según la regla: Titulada aplica, Complementaria no
    let finalProjectReport = null;
    if (tipoFormacion === 'TITULADA') {
      finalProjectReport = proyectoOption === 'custom' && proyectoCustom
        ? proyectoCustom
        : DEFAULT_ADSO_PROJECT;
    }

    onSave({
      numero: numero.trim(),
      programa: nombrePrograma.trim(),
      codigo: codigoPrograma.trim(),
      version: versionPrograma.trim() || '1',
      tipoFormacion,
      nivel: nivelPrograma,
      jornada,
      estado,
      fechaInicio,
      fechaFin,
      regional: regional.trim(),
      centro: centro.trim(),
      disenoCurricular: disenoFile ? disenoFile.name : null,
      reporteProyecto: finalProjectReport
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" style={{ maxWidth: '880px', width: '95%' }}>
        
        {/* Cabecera Institucional */}
        <div className="modal-header" style={{ background: '#00324D', color: '#ffffff', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(57, 169, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="ph ph-folder-plus" style={{ fontSize: '1.4rem', color: '#39A900' }}></i>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem' }}>
                Registrar y Caracterizar Nueva Ficha
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
                SENA CIES Regional Huila — Gestión Curricular y Proyectos Formativos
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ color: '#ffffff' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Barra de Segmentos (Wizard de Creación) */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0.5rem 1.5rem 0',
          gap: '0.5rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveSegment('caracterizacion')}
            style={{
              padding: '0.65rem 1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSegment === 'caracterizacion' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeSegment === 'caracterizacion' ? '700' : '500',
              color: activeSegment === 'caracterizacion' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem'
            }}
          >
            <i className="ph ph-identification-card" style={{ fontSize: '1.05rem' }}></i>
            1. Caracterización de Ficha
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('programa')}
            style={{
              padding: '0.65rem 1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSegment === 'programa' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeSegment === 'programa' ? '700' : '500',
              color: activeSegment === 'programa' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem'
            }}
          >
            <i className="ph ph-graduation-cap" style={{ fontSize: '1.05rem' }}></i>
            2. Programa de Formación
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('curricular')}
            style={{
              padding: '0.65rem 1rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSegment === 'curricular' ? '3px solid #39A900' : '3px solid transparent',
              fontWeight: activeSegment === 'curricular' ? '700' : '500',
              color: activeSegment === 'curricular' ? '#00324D' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem'
            }}
          >
            <i className="ph ph-briefcase" style={{ fontSize: '1.05rem' }}></i>
            3. Diseño y Proyecto Formativo
            {tipoFormacion === 'COMPLEMENTARIA' && (
              <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                No Aplica
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '1.5rem', background: '#f8fafc' }}>
            
            {/* ========================================================
                SEGMENTO 1: CARACTERIZACIÓN GENERAL DE LA FICHA
               ======================================================== */}
            {activeSegment === 'caracterizacion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem', color: '#00324D', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="ph ph-info" style={{ color: '#0284c7' }}></i>
                    Identificación Básica de Caracterización (SOFIA Plus)
                  </h4>

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
                        style={{ fontSize: '1.05rem', fontWeight: '700', color: '#00324D' }}
                      />
                      <small style={{ color: '#64748b' }}>Entre 6 y 10 dígitos numéricos oficiales</small>
                    </div>

                    <div className="form-group flex-1">
                      <label>Modalidad / Jornada *</label>
                      <select value={jornada} onChange={(e) => setJornada(e.target.value)}>
                        <option value="PRESENCIAL">Presencial (Diurna)</option>
                        <option value="MIXTA">Mixta / Nocturna</option>
                        <option value="VIRTUAL">Virtual (100% en línea)</option>
                        <option value="FIN_DE_SEMANA">Fines de Semana</option>
                      </select>
                    </div>

                    <div className="form-group flex-1">
                      <label>Estado de la Ficha *</label>
                      <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                        <option value="EN EJECUCION">EN EJECUCION (Lectiva)</option>
                        <option value="ETAPA PRODUCTIVA">ETAPA PRODUCTIVA</option>
                        <option value="FINALIZADA">FINALIZADA</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '0.5rem' }}>
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
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem', color: '#00324D', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="ph ph-buildings" style={{ color: '#39A900' }}></i>
                    Ubicación Institucional SENA
                  </h4>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Regional SENA</label>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setActiveSegment('programa')}
                    style={{ gap: '0.5rem' }}
                  >
                    <span>Continuar a Selección de Programa</span>
                    <i className="ph ph-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                SEGMENTO 2: SELECCIÓN Y DEFINICIÓN DEL PROGRAMA
               ======================================================== */}
            {activeSegment === 'programa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Selector de Tipo de Formación: Titulada vs Complementaria */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                  <label style={{ fontWeight: '700', color: '#00324D', fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>
                    Tipo de Oferta Formativa SENA *
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div 
                      onClick={() => handleTipoFormacionChange('TITULADA')}
                      style={{
                        border: tipoFormacion === 'TITULADA' ? '2px solid #39A900' : '1px solid #e2e8f0',
                        background: tipoFormacion === 'TITULADA' ? '#f0fdf4' : '#ffffff',
                        borderRadius: '10px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <i className="ph ph-certificate" style={{ fontSize: '1.4rem', color: tipoFormacion === 'TITULADA' ? '#39A900' : '#64748b' }}></i>
                        <strong style={{ color: '#00324D', fontSize: '0.95rem' }}>Formación Titulada</strong>
                        <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          Aplica Proyecto
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                        Técnicos, Tecnólogos y Especializaciones. Requiere Proyecto Formativo oficial (4 Fases) y Diseño Curricular estructurado.
                      </p>
                    </div>

                    <div 
                      onClick={() => handleTipoFormacionChange('COMPLEMENTARIA')}
                      style={{
                        border: tipoFormacion === 'COMPLEMENTARIA' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: tipoFormacion === 'COMPLEMENTARIA' ? '#f0f9ff' : '#ffffff',
                        borderRadius: '10px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <i className="ph ph-lightning" style={{ fontSize: '1.4rem', color: tipoFormacion === 'COMPLEMENTARIA' ? '#0284c7' : '#64748b' }}></i>
                        <strong style={{ color: '#00324D', fontSize: '0.95rem' }}>Formación Complementaria</strong>
                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', fontWeight: '700', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          No Aplica Proyecto
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                        Cursos cortos y actualización continua (40h - 48h). <em>No formula Proyecto Formativo ni Diseño Curricular por fases</em>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selección o Registro de Programa */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 1rem', color: '#00324D', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="ph ph-book-open" style={{ color: '#39A900' }}></i>
                    Selección o Registro de Programa de Formación
                  </h4>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Seleccionar Programa Registrado</label>
                    <select value={selectedProgramaKey} onChange={handleProgramaChange} style={{ fontWeight: '600' }}>
                      <optgroup label="Programas de Formación Titulada (CIES Huila)">
                        {PROGRAMAS_CATALOGO.filter(p => p.tipoFormacion === 'TITULADA').map(p => (
                          <option key={p.codigo} value={p.codigo}>
                            {p.codigo} — {p.nombre} ({p.nivel})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Programas de Formación Complementaria (Cursos Cortos)">
                        {PROGRAMAS_CATALOGO.filter(p => p.tipoFormacion === 'COMPLEMENTARIA').map(p => (
                          <option key={p.codigo} value={p.codigo}>
                            {p.codigo} — {p.nombre} (40-48 Horas)
                          </option>
                        ))}
                      </optgroup>
                      <option value="NUEVO">+ Cargar / Registrar Nuevo Programa de Formación...</option>
                    </select>
                  </div>

                  {/* Campos detallados del Programa */}
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Código del Programa *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej: 228118"
                        value={codigoPrograma}
                        onChange={(e) => setCodigoPrograma(e.target.value)}
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>Versión del Programa</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 1"
                        value={versionPrograma}
                        onChange={(e) => setVersionPrograma(e.target.value)}
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>Nivel de Formación</label>
                      <select value={nivelPrograma} onChange={(e) => setNivelPrograma(e.target.value)}>
                        <option value="TECNOLOGO">Tecnólogo</option>
                        <option value="TECNICO">Técnico Laboral</option>
                        <option value="ESPECIALIZACION TECNOLOGICA">Especialización Tecnológica</option>
                        <option value="CURSO CORTO">Curso Corto Complementario</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label>Denominación Oficial del Programa *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: ANALISIS Y DESARROLLO DE SOFTWARE"
                      value={nombrePrograma}
                      onChange={(e) => setNombrePrograma(e.target.value)}
                      style={{ fontWeight: '600', color: '#00324D' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setActiveSegment('caracterizacion')}
                  >
                    <i className="ph ph-arrow-left"></i> Anterior
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setActiveSegment('curricular')}
                    style={{ gap: '0.5rem' }}
                  >
                    <span>Configurar Diseño y Proyecto</span>
                    <i className="ph ph-arrow-right"></i>
                  </button>
                </div>

              </div>
            )}

            {/* ========================================================
                SEGMENTO 3: DISEÑO CURRICULAR Y PROYECTO FORMATIVO
                REGLA SOLICITADA: Titulada aplica, Complementaria no
               ======================================================== */}
            {activeSegment === 'curricular' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Caso 1: FORMACIÓN COMPLEMENTARIA (NO APLICA) */}
                {tipoFormacion === 'COMPLEMENTARIA' ? (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem'
                    }}>
                      <i className="ph ph-info" style={{ fontSize: '2rem' }}></i>
                    </div>

                    <h4 style={{ margin: '0 0 0.5rem', color: '#00324D', fontSize: '1.15rem' }}>
                      Proyecto Formativo y Diseño Curricular: No Aplica
                    </h4>

                    <p style={{ maxWidth: '580px', margin: '0 auto 1.25rem', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                      De acuerdo con la normatividad curricular del SENA (<strong>Acuerdo 008 de 1997</strong> y <strong>Guía GFPI-G-012</strong>), en los cursos de <strong>Formación Complementaria</strong> no se formulan Proyectos Formativos ni Diseños Curriculares divididos en fases lectivas/productivas.
                    </p>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#065f46'
                    }}>
                      <i className="ph ph-check-circle" style={{ color: '#39A900', fontSize: '1.1rem' }}></i>
                      <span>La ficha se creará lista para asociar aprendices y asentar juicios evaluativos directos.</span>
                    </div>
                  </div>
                ) : (
                  /* Caso 2: FORMACIÓN TITULADA (SÍ APLICA) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    <div style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '10px',
                      padding: '0.85rem 1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.85rem',
                      color: '#065f46'
                    }}>
                      <i className="ph ph-check-circle" style={{ fontSize: '1.3rem' }}></i>
                      <span>
                        <strong>Formación Titulada Activa:</strong> Requiere vinculación del Proyecto Formativo (GPFI-F-134 / GFPI-F-016) y Diseño Curricular por competencias.
                      </span>
                    </div>

                    {/* Componente A: Diseño Curricular */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                      <h4 style={{ margin: '0 0 0.4rem', color: '#00324D', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <i className="ph ph-file-text" style={{ color: '#0284c7' }}></i>
                        1. Diseño Curricular Oficial del Programa
                      </h4>
                      <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#64748b' }}>
                        Adjunte el documento del Diseño Curricular del programa (perfil de egreso, competencias y resultados).
                      </p>

                      <div style={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center',
                        background: disenoFile ? '#f0fdf4' : '#f8fafc',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('disenoFileInput').click()}
                      >
                        <input 
                          type="file" 
                          id="disenoFileInput" 
                          accept=".pdf,.xlsx,.xls,.json" 
                          style={{ display: 'none' }} 
                          onChange={(e) => setDisenoFile(e.target.files[0] || null)}
                        />
                        <i className={disenoFile ? 'ph ph-file-check' : 'ph ph-upload-simple'} style={{ fontSize: '1.6rem', color: disenoFile ? '#39A900' : '#64748b' }}></i>
                        <div style={{ marginTop: '0.3rem', fontSize: '0.85rem', color: '#00324D', fontWeight: '600' }}>
                          {disenoFile ? disenoFile.name : 'Haga clic para adjuntar archivo de Diseño Curricular (.pdf / .xlsx / .json)'}
                        </div>
                        {disenoFile && (
                          <small style={{ color: '#059669' }}>
                            {(disenoFile.size / 1024).toFixed(1)} KB — Listo para vincular
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Componente B: Proyecto Formativo */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                      <h4 style={{ margin: '0 0 0.4rem', color: '#00324D', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <i className="ph ph-briefcase" style={{ color: '#39A900' }}></i>
                        2. Proyecto Formativo (GFPI-F-016 / GPFI-F-134)
                      </h4>
                      <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#64748b' }}>
                        Estructura curricular de 4 Fases (Análisis, Planeación, Ejecución, Evaluación) y RAPs asociados.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        {/* Opción 1: Matriz ADSO 2417180 por defecto */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          padding: '0.85rem',
                          border: proyectoOption === 'default' ? '2px solid #39A900' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: proyectoOption === 'default' ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer'
                        }}>
                          <input 
                            type="radio" 
                            name="proyectoOption" 
                            checked={proyectoOption === 'default'} 
                            onChange={() => setProyectoOption('default')} 
                            style={{ marginTop: '3px' }}
                          />
                          <div>
                            <strong style={{ color: '#00324D', fontSize: '0.88rem' }}>
                              Usar Matriz Curricular Oficial ADSO (Proyecto SOFIA: 2417180)
                            </strong>
                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                              Incluye 75 RAPs oficiales divididos en Análisis (25), Planeación (17), Ejecución (23) y Evaluación (10).
                            </span>
                          </div>
                        </label>

                        {/* Opción 2: Cargar archivo personalizado */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          padding: '0.85rem',
                          border: proyectoOption === 'custom' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: proyectoOption === 'custom' ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer'
                        }}>
                          <input 
                            type="radio" 
                            name="proyectoOption" 
                            checked={proyectoOption === 'custom'} 
                            onChange={() => setProyectoOption('custom')} 
                            style={{ marginTop: '3px' }}
                          />
                          <div>
                            <strong style={{ color: '#00324D', fontSize: '0.88rem' }}>
                              Cargar Matriz de Planeación Pedagógica Personalizada (.xlsx / .json)
                            </strong>
                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                              Suba el formato GPFI-F-134 o reporte GFPI-F-016 para extraer automáticamente las fases y RAPs.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Dropzone para Proyecto Personalizado */}
                      {proyectoOption === 'custom' && (
                        <div style={{
                          border: '2px dashed #93c5fd',
                          borderRadius: '8px',
                          padding: '1.25rem',
                          textAlign: 'center',
                          background: proyectoFileName ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => document.getElementById('proyectoFileInput').click()}
                        >
                          <input 
                            type="file" 
                            id="proyectoFileInput" 
                            accept=".xlsx,.xls,.json,.pdf" 
                            style={{ display: 'none' }} 
                            onChange={handleProyectoFileUpload} 
                          />
                          <i className={proyectoFileName ? 'ph ph-check-circle' : 'ph ph-file-arrow-up'} style={{ fontSize: '2rem', color: proyectoFileName ? '#39A900' : '#2563eb' }}></i>
                          <div style={{ marginTop: '0.3rem', fontSize: '0.88rem', fontWeight: '600', color: '#00324D' }}>
                            {proyectoFileName ? proyectoFileName : 'Haga clic para seleccionar archivo GPFI-F-134 (.xlsx / .xls)'}
                          </div>
                          {proyectoCustom && (
                            <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#065f46' }}>
                              ✓ Proyecto: {proyectoCustom.codigoProyecto || 'Detectado'} — {proyectoCustom.fases?.length || 4} Fases Formativas procesadas
                            </div>
                          )}
                          {isProcessingFile && (
                            <small style={{ color: '#39A900' }}>Procesando archivo...</small>
                          )}
                        </div>
                      )}

                      {errorCurricular && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.82rem' }}>
                          <i className="ph ph-warning"></i> {errorCurricular}
                        </div>
                      )}

                    </div>

                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setActiveSegment('programa')}
                  >
                    <i className="ph ph-arrow-left"></i> Anterior
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ gap: '0.5rem', background: '#39A900', borderColor: '#39A900' }}
                  >
                    <i className="ph ph-floppy-disk"></i>
                    <span>Crear y Guardar Ficha</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Pie del Modal */}
          <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Segmento {activeSegment === 'caracterizacion' ? '1 de 3' : activeSegment === 'programa' ? '2 de 3' : '3 de 3'}: {
                activeSegment === 'caracterizacion' ? 'Datos de Caracterización' :
                activeSegment === 'programa' ? 'Programa de Formación' : 'Diseño y Proyecto Formativo'
              }
            </span>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
