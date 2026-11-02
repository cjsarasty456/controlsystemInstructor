import * as XLSX_PKG from 'xlsx';
import { parseSenaDateParts } from './dateUtils';

/**
 * Servicio de extracción y lectura de reportes Excel de SOFIA Plus / Zajuna (.xls / .xlsx)
 * 
 * Regla de Oro SENA:
 * Un aprendiz aparece N veces (una por cada RAP, ej: 75 RAPs en ADSO).
 * Este parser DEDUPLICA automáticamente para registrar exactamente 1 aprendiz,
 * agrupando sus N juicios de RAPs correspondientes y formateando la fecha de registro/asentamiento.
 */

export const parseSenaExcelReport = async (file) => {
  return new Promise((resolve, reject) => {
    const XLSX = (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : XLSX_PKG;
    if (!XLSX) {
      reject(new Error("La biblioteca SheetJS (XLSX) no está disponible."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        // 1. Extraer Metadatos Institucionales de Cabecera (Filas 1 a 12)
        const meta = {
          filename: file.name,
          fechaReporte: '',
          numeroFicha: '',
          codigoPrograma: '',
          version: '',
          denominacion: '',
          estadoFicha: '',
          fechaInicio: '',
          fechaFin: '',
          modalidad: '',
          regional: '',
          centro: ''
        };

        let headerRowIndex = 12;

        for (let r = 0; r < Math.min(rows.length, 25); r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const colA = String(row[0] || '').trim().toLowerCase();
          const colB = String(row[1] || '').trim();

          if (colA.includes('fecha del reporte')) meta.fechaReporte = colB;
          if (colA.includes('ficha de caracterizaci')) meta.numeroFicha = colB;
          if (colA.includes('cógigo') || colA.includes('código')) meta.codigoPrograma = colB;
          if (colA.includes('versión') || colA.includes('version')) meta.version = colB;
          if (colA.includes('denominación') || colA.includes('denominacion')) meta.denominacion = colB;
          if (colA.includes('estado de la ficha')) meta.estadoFicha = colB;
          if (colA.includes('fecha inicio')) meta.fechaInicio = colB;
          if (colA.includes('fecha fin')) meta.fechaFin = colB;
          if (colA.includes('modalidad de formación')) meta.modalidad = colB;
          if (colA.includes('regional')) meta.regional = colB;
          if (colA.includes('centro de formación')) meta.centro = colB;

          // Detección dinámica de fila de encabezados
          const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('tipo de documento') || rowStr.includes('número de documento') || rowStr.includes('juicio de evaluación')) {
            headerRowIndex = r;
          }
        }

        // Detección inteligente de columnas por encabezado
        const headerRow = (rows[headerRowIndex] || []).map(c => 
          String(c || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        );

        const findColIndex = (keywords, defaultIndex) => {
          const idx = headerRow.findIndex(h => keywords.some(k => h.includes(k)));
          return idx >= 0 ? idx : defaultIndex;
        };

        const idxTipoDoc = findColIndex(['tipo de documento', 'tipo doc'], 0);
        const idxNumDoc = findColIndex(['numero de documento', 'documento', 'num doc', 'identificacion'], 1);
        const idxNombre = findColIndex(['nombre'], 2);
        const idxApellidos = findColIndex(['apellido'], 3);
        const idxEstado = findColIndex(['estado del aprendiz', 'estado aprendiz', 'estado'], 4);
        const idxCompetencia = findColIndex(['competencia'], 5);
        const idxRap = findColIndex(['resultado de aprendizaje', 'resultado', 'rap'], 6);
        const idxJuicio = findColIndex(['juicio de evaluacion', 'juicio evaluativo', 'juicio'], 7);
        const idxFecha = findColIndex(['fecha y hora', 'fecha de juicio', 'fecha asentamiento', 'fecha registro', 'fecha'], 8);
        const idxFuncionario = findColIndex(['funcionario', 'instructor', 'usuario'], 9);

        // 2. Extraer Filas y Deduplicar Aprendices (1 aprendiz -> N RAPs)
        const allJuiciosRows = [];
        const aprendicesMap = new Map();

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;

          const tipoDoc = String(row[idxTipoDoc] || '').trim();
          const numDoc = String(row[idxNumDoc] || '').trim();
          const nombre = String(row[idxNombre] || '').trim();
          const apellidos = String(row[idxApellidos] || '').trim();
          const estadoApr = String(row[idxEstado] || '').trim();
          const competencia = String(row[idxCompetencia] || '').trim();
          const rap = String(row[idxRap] || '').trim();
          
          let juicioVal = String(row[idxJuicio] || '').trim();
          if (!juicioVal && row[idxJuicio + 1] && (String(row[idxJuicio + 1]).trim() === 'APROBADO' || String(row[idxJuicio + 1]).trim() === 'NO APROBADO')) {
            juicioVal = String(row[idxJuicio + 1]).trim();
          }

          let juicioNormalizado = 'POR EVALUAR';
          const jUpper = juicioVal.toUpperCase();
          if (jUpper.includes('APROBADO') && !jUpper.includes('NO')) {
            juicioNormalizado = 'APROBADO';
          } else if (jUpper.includes('NO APROBADO') || jUpper.includes('DEFICIENTE')) {
            juicioNormalizado = 'NO APROBADO';
          }

          // Procesar y normalizar la fecha de registro / asentamiento del juicio
          const rawFecha = row[idxFecha];
          const parsedFecha = parseSenaDateParts(rawFecha);
          const fechaHoraJuicio = parsedFecha.fullFormatted || parsedFecha.dateStr || '';

          const funcionario = String(row[idxFuncionario] || '').trim();

          if (numDoc) {
            const juicioItem = {
              tipoDoc,
              numDoc,
              nombre,
              apellidos,
              estadoApr,
              competencia,
              rap,
              juicio: juicioNormalizado,
              juicioOriginal: juicioVal,
              fechaHoraJuicio,
              funcionario
            };

            allJuiciosRows.push(juicioItem);

            // Deduplicación estricta por Número de Documento
            if (!aprendicesMap.has(numDoc)) {
              aprendicesMap.set(numDoc, {
                tipoDoc,
                numDoc,
                nombreCompleto: `${nombre} ${apellidos}`.trim(),
                nombre,
                apellidos,
                estado: estadoApr || 'EN FORMACION',
                raps: [],
                aprobados: 0,
                pendientes: 0,
                noAprobados: 0,
                totalRaps: 0
              });
            }

            const apr = aprendicesMap.get(numDoc);
            apr.raps.push({
              competencia,
              rap,
              juicio: juicioNormalizado,
              fechaHora: fechaHoraJuicio,
              funcionario
            });
            apr.totalRaps++;

            if (juicioNormalizado === 'APROBADO') apr.aprobados++;
            else if (juicioNormalizado === 'NO APROBADO') apr.noAprobados++;
            else apr.pendientes++;
          }
        }

        resolve({
          meta,
          totalFilasExcel: allJuiciosRows.length,
          totalAprendicesUnicos: aprendicesMap.size,
          aprendices: Array.from(aprendicesMap.values()),
          juicios: allJuiciosRows
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
