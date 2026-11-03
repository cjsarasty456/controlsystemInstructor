import { DEFAULT_ADSO_PROJECT } from './projectReportService';
import { generateUUID, isUUID } from '../utils/uuid';

/**
 * Servicio de almacenamiento local para React
 * Sin sembrador de datos falsos (No Mock Data).
 */

const STORAGE_KEY = 'controlsystem_fichas_react_v1';

// Documentos falsos/semilla anteriores a purgar obligatoriamente
export const MOCK_DOCS = new Set([
  '1075254123', // Carlos Julio (mock)
  '1075345678', // Andrea Carolina (mock)
  '1075987654', // Juan Camilo (mock con 2 reprobados)
  '1080123456', // Valentina (mock)
  '1081654321'  // Brayan Stiven (mock con 1 reprobado)
]);

export const initialFichasData = [
  {
    id: '36ce51f0-8663-4871-b98e-79ed41391600',
    backendId: '36ce51f0-8663-4871-b98e-79ed41391600',
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
    aprendices: [],
    reportes: [],
    juicios: []
  },
  {
    id: 'a3f89b41-76c2-4e01-9a2c-9828e1240002',
    numero: '3145555',
    programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
    codigo: '228118',
    version: '1',
    jornada: 'MIXTA',
    estado: 'EN EJECUCION',
    fechaInicio: '2024-10-01',
    fechaFin: '2026-04-30',
    regional: '41 - REGIONAL HUILA',
    centro: '9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS',
    reporteProyecto: DEFAULT_ADSO_PROJECT,
    aprendices: [],
    reportes: [],
    juicios: []
  },
  {
    id: 'a3f89b41-76c2-4e01-9a2c-9828e1240003',
    numero: '3239188',
    programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
    codigo: '228118',
    version: '1',
    jornada: 'VIRTUAL',
    estado: 'EN EJECUCION',
    fechaInicio: '2025-02-10',
    fechaFin: '2027-08-15',
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
        // Asegurar que toda ficha tenga ID en formato UUID
        const fichaUUID = isUUID(f.id) ? f.id : (f.backendId && isUUID(f.backendId) ? f.backendId : generateUUID());

        // Sanitizar aprendices: eliminar corruptos y purgar los 5 aprendices de prueba falsos
        const aprendicesValidos = (f.aprendices || []).filter(a => {
          const num = String(a.numDoc || '').trim().toUpperCase();
          const tipo = String(a.tipoDoc || '').trim().toUpperCase();
          return num !== '' && 
                 num !== 'CC' && 
                 num !== 'TI' && 
                 num !== 'CE' && 
                 num !== tipo && 
                 (a.totalRaps || 0) < 500 &&
                 !MOCK_DOCS.has(num);
        });

        // Purgar también juicios de los aprendices falsos
        const juiciosValidos = (f.juicios || []).filter(j => {
          const num = String(j.numDoc || '').trim();
          return num !== '' && !MOCK_DOCS.has(num);
        });

        return {
          ...f,
          id: fichaUUID,
          backendId: f.backendId || fichaUUID,
          aprendices: aprendicesValidos,
          juicios: juiciosValidos,
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
