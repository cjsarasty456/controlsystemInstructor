import { DEFAULT_ADSO_PROJECT } from './projectReportService';

/**
 * Servicio de almacenamiento local para React
 */

const STORAGE_KEY = 'controlsystem_fichas_react_v1';

// Generar aprendices y juicios de prueba con la estructura oficial del Proyecto 2417180
export const createSampleLearnersAndJuicios = () => {
  const sampleLearnersMeta = [
    { numDoc: '1075254123', nombre: 'Carlos Julio', apellidos: 'Cadena Sarasty', tipoDoc: 'CC', estado: 'EN FORMACION', targetPct: 0.75, noAprobadosIndices: [] },
    { numDoc: '1075345678', nombre: 'Andrea Carolina', apellidos: 'Morales Puentes', tipoDoc: 'CC', estado: 'EN FORMACION', targetPct: 0.90, noAprobadosIndices: [] },
    { numDoc: '1075987654', nombre: 'Juan Camilo', apellidos: 'Perdomo Silva', tipoDoc: 'CC', estado: 'EN FORMACION', targetPct: 0.45, noAprobadosIndices: [3, 7] },
    { numDoc: '1080123456', nombre: 'Valentina', apellidos: 'Vargas Rojas', tipoDoc: 'CC', estado: 'EN FORMACION', targetPct: 0.65, noAprobadosIndices: [] },
    { numDoc: '1081654321', nombre: 'Brayan Stiven', apellidos: 'Ortiz Mendez', tipoDoc: 'CC', estado: 'EN FORMACION', targetPct: 0.30, noAprobadosIndices: [12] }
  ];

  // Extraer todos los RAPs del Proyecto ADSO 2417180
  const allProjectRaps = [];
  DEFAULT_ADSO_PROJECT.fases.forEach(f => {
    f.competencias.forEach(c => {
      (c.raps || []).forEach((rCode, idx) => {
        allProjectRaps.push({
          competencia: `${c.codigo} - ${c.nombre}`,
          rap: `${rCode} - RAP ${String(idx + 1).padStart(2, '0')}: Resultado de Aprendizaje en ${f.nombre}`,
          fase: f.nombre
        });
      });
    });
  });

  const aprendices = [];
  const consolidadoJuicios = [];

  sampleLearnersMeta.forEach(meta => {
    const total = allProjectRaps.length;
    let aprobados = 0;
    let noAprobados = 0;
    let pendientes = 0;
    const learnerRaps = [];

    allProjectRaps.forEach((pRap, i) => {
      let juicio = 'POR EVALUAR';
      if (meta.noAprobadosIndices.includes(i)) {
        juicio = 'NO APROBADO';
        noAprobados++;
      } else if (i < total * meta.targetPct) {
        juicio = 'APROBADO';
        aprobados++;
      } else {
        pendientes++;
      }

      const rapEntry = {
        competencia: pRap.competencia,
        rap: pRap.rap,
        juicio,
        fechaHora: juicio === 'APROBADO' ? '15/02/2026 10:30' : (juicio === 'NO APROBADO' ? '20/02/2026 14:15' : ''),
        funcionario: 'Carlos Julio Cadena (Instructor)'
      };
      learnerRaps.push(rapEntry);

      consolidadoJuicios.push({
        tipoDoc: meta.tipoDoc,
        numDoc: meta.numDoc,
        nombre: meta.nombre,
        apellidos: meta.apellidos,
        nombreCompleto: `${meta.nombre} ${meta.apellidos}`.trim(),
        estadoApr: meta.estado,
        competencia: pRap.competencia,
        rap: pRap.rap,
        juicio,
        fechaHoraJuicio: rapEntry.fechaHora,
        funcionario: rapEntry.funcionario
      });
    });

    aprendices.push({
      tipoDoc: meta.tipoDoc,
      numDoc: meta.numDoc,
      nombre: meta.nombre,
      apellidos: meta.apellidos,
      nombreCompleto: `${meta.nombre} ${meta.apellidos}`.trim(),
      estado: meta.estado,
      totalRaps: total,
      aprobados,
      pendientes,
      noAprobados,
      raps: learnerRaps
    });
  });

  return { aprendices, consolidadoJuicios };
};

const sampleSeed = createSampleLearnersAndJuicios();

export const initialFichasData = [
  {
    id: 'ficha_3145556',
    numero: '3145556',
    programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
    codigo: '228118',
    version: '1',
    jornada: 'PRESENCIAL',
    estado: 'EN EJECUCION',
    fechaInicio: '2024-12-16',
    fechaFin: '2027-05-07',
    regional: '41 - REGIONAL HUILA',
    centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
    reporteProyecto: DEFAULT_ADSO_PROJECT,
    aprendices: sampleSeed.aprendices,
    reportes: [
      {
        id: 'cargue_init_1',
        numeroCargue: 1,
        filename: 'Reporte_Juicios_3145556_Oficial.xls',
        fechaReporte: '02/11/2026',
        fechaCargue: '02/11/2026 14:30:00',
        totalFilasExcel: 180,
        totalAprendicesAfectados: 5,
        aprendicesNuevos: 5,
        aprendicesActualizados: 0,
        juiciosNuevosAprobados: 120,
        subidoPor: 'Carlos Julio Cadena (Instructor)',
        observacion: 'Cargue inicial institucional sincronizado.'
      }
    ],
    juicios: sampleSeed.consolidadoJuicios
  },
  {
    id: 'ficha_3145555',
    numero: '3145555',
    programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
    codigo: '228118',
    version: '1',
    jornada: 'PRESENCIAL',
    estado: 'EN EJECUCION',
    fechaInicio: '2024-12-16',
    fechaFin: '2027-05-07',
    regional: '41 - REGIONAL HUILA',
    centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
    reporteProyecto: DEFAULT_ADSO_PROJECT,
    aprendices: [],
    reportes: [],
    juicios: []
  },
  {
    id: 'ficha_3239137',
    numero: '3239137',
    programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
    codigo: '228118',
    version: '1',
    jornada: 'MIXTA',
    estado: 'EN EJECUCION',
    fechaInicio: '2024-10-01',
    fechaFin: '2026-12-15',
    regional: '41 - REGIONAL HUILA',
    centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
    reporteProyecto: DEFAULT_ADSO_PROJECT,
    aprendices: [],
    reportes: [],
    juicios: []
  }
];

export const loadFichas = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(f => {
        // Si la ficha no tiene aprendices y es la 3145556, inyectar aprendices semilla para pruebas inmediatas
        if ((!f.aprendices || f.aprendices.length === 0) && f.numero === '3145556') {
          return {
            ...f,
            reporteProyecto: f.reporteProyecto || DEFAULT_ADSO_PROJECT,
            aprendices: sampleSeed.aprendices,
            juicios: f.juicios && f.juicios.length > 0 ? f.juicios : sampleSeed.consolidadoJuicios,
            reportes: f.reportes && f.reportes.length > 0 ? f.reportes : initialFichasData[0].reportes
          };
        }
        return {
          ...f,
          reporteProyecto: f.reporteProyecto || DEFAULT_ADSO_PROJECT
        };
      });
    } catch (e) {
      console.error('Error parseando localStorage', e);
    }
  }
  return initialFichasData;
};

export const saveFichas = (fichas) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fichas));
};
