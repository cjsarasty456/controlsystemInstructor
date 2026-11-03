import * as XLSX_PKG from 'xlsx';
import { parseSenaDateParts } from './dateUtils';

/**
 * Servicio de extracción y lectura de reportes Excel de SOFIA Plus / Zajuna (.xls / .xlsx)
 * 
 * Regla de Oro SENA:
 * Un aprendiz aparece N veces (una por cada RAP, ej: 75 RAPs en ADSO).
 * Este parser DEDUPLICA automáticamente para registrar exactamente 1 aprendiz por su número de documento,
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
          const rowStr = row.map(c => 
            String(c || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
          ).join(' ');

          if (rowStr.includes('tipo de documento') || rowStr.includes('numero de documento') || rowStr.includes('juicio de evaluacion')) {
            headerRowIndex = r;
          }
        }

        // 2. Detección Inteligente e Inequívoca de Columnas por Encabezado
        const headerRow = (rows[headerRowIndex] || []).map(c => 
          String(c || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        );

        let idxTipoDoc = -1;
        let idxNumDoc = -1;
        let idxNombre = -1;
        let idxApellidos = -1;
        let idxEstado = -1;
        let idxCompetencia = -1;
        let idxRap = -1;
        let idxJuicio = -1;
        let idxFecha = -1;
        let idxFuncionario = -1;

        headerRow.forEach((h, colIdx) => {
          if (!h) return;

          // Tipo de Documento: debe contener 'tipo' y ('doc' o 'documento')
          if (h.includes('tipo') && (h.includes('doc') || h.includes('identificacion'))) {
            idxTipoDoc = colIdx;
          }
          // Número de Documento: contiene 'numero'/'num'/'nro'/'identificacion', O 'documento' SIN 'tipo'
          else if (
            ((h.includes('numero') || h.includes('num') || h.includes('nro')) && (h.includes('doc') || h.includes('identificacion'))) ||
            (h.includes('documento') && !h.includes('tipo')) ||
            h === 'documento' || h === 'identificacion'
          ) {
            idxNumDoc = colIdx;
          }
          // Nombre del aprendiz (NO funcionario, NO instructor, NO programa)
          else if (h.includes('nombre') && !h.includes('funcionario') && !h.includes('instructor') && !h.includes('programa')) {
            idxNombre = colIdx;
          }
          // Apellidos del aprendiz
          else if (h.includes('apellido')) {
            idxApellidos = colIdx;
          }
          // Estado del aprendiz
          else if (h.includes('estado')) {
            idxEstado = colIdx;
          }
          // Competencia Laboral
          else if (h.includes('competencia')) {
            idxCompetencia = colIdx;
          }
          // Resultado de Aprendizaje (RAP)
          else if (h.includes('resultado') || h.includes('rap')) {
            idxRap = colIdx;
          }
          // Juicio de Evaluación (NO fecha, NO hora, NO funcionario)
          else if (h.includes('juicio') && !h.includes('fecha') && !h.includes('hora') && !h.includes('funcionario') && !h.includes('instructor')) {
            idxJuicio = colIdx;
          }
          // Fecha y Hora del Juicio (NO funcionario, NO instructor)
          else if ((h.includes('fecha') || h.includes('hora') || h.includes('asentamiento')) && !h.includes('funcionario') && !h.includes('instructor')) {
            idxFecha = colIdx;
          }
          // Funcionario que registró el juicio
          else if (h.includes('funcionario') || h.includes('instructor') || h.includes('registro el')) {
            idxFuncionario = colIdx;
          }
        });

        // Fallbacks posicionales estándar de la plantilla de SOFIA Plus CIES
        if (idxTipoDoc === -1) idxTipoDoc = 0;
        if (idxNumDoc === -1) idxNumDoc = 1;
        if (idxNombre === -1) idxNombre = 2;
        if (idxApellidos === -1) idxApellidos = 3;
        if (idxEstado === -1) idxEstado = 4;
        if (idxCompetencia === -1) idxCompetencia = 5;
        if (idxRap === -1) idxRap = 6;
        if (idxJuicio === -1) idxJuicio = 7;
        if (idxFecha === -1) idxFecha = 9; // SOFIA Plus tiene una columna vacía en índice 8
        if (idxFuncionario === -1) idxFuncionario = 10;

        // 3. Extraer Filas y Deduplicar Aprendices (1 aprendiz por documento -> N RAPs deduplicados)
        const allJuiciosRows = [];
        const aprendicesMap = new Map();

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;

          let tipoDoc = String(row[idxTipoDoc] !== undefined ? row[idxTipoDoc] : '').trim();
          let numDoc = String(row[idxNumDoc] !== undefined ? row[idxNumDoc] : '').trim();
          const nombre = String(row[idxNombre] !== undefined ? row[idxNombre] : '').trim();
          const apellidos = String(row[idxApellidos] !== undefined ? row[idxApellidos] : '').trim();
          const estadoApr = String(row[idxEstado] !== undefined ? row[idxEstado] : '').trim();
          const competencia = String(row[idxCompetencia] !== undefined ? row[idxCompetencia] : '').trim();
          const rap = String(row[idxRap] !== undefined ? row[idxRap] : '').trim();
          
          // Corrección si tipoDoc viene con el número de documento y numDoc vacío
          if (/^\d{6,12}$/.test(tipoDoc) && !numDoc) {
            numDoc = tipoDoc;
            tipoDoc = 'CC';
          }

          // Si no hay número de documento válido o es un pie de página, ignorar fila
          if (!numDoc || numDoc.toLowerCase() === 'null' || numDoc === '-') continue;

          let juicioVal = String(row[idxJuicio] !== undefined ? row[idxJuicio] : '').trim();
          // Soporte si el juicio viene en la celda contigua (ej: columna 8)
          if (!juicioVal && row[idxJuicio + 1] && (String(row[idxJuicio + 1]).trim() === 'APROBADO' || String(row[idxJuicio + 1]).trim() === 'NO APROBADO')) {
            juicioVal = String(row[idxJuicio + 1]).trim();
          }

          let juicioNormalizado = 'POR EVALUAR';
          const jUpper = juicioVal.toUpperCase();
          if (jUpper.includes('APROBADO') && !jUpper.includes('NO')) {
            juicioNormalizado = 'APROBADO';
          } else if (jUpper.includes('NO APROBADO') || jUpper.includes('DEFICIENTE') || jUpper.includes('REPROBADO')) {
            juicioNormalizado = 'NO APROBADO';
          }

          // Procesar y normalizar la fecha de registro / asentamiento del juicio (incluyendo formatos con '8.52 a')
          const rawFecha = row[idxFecha] || row[idxFecha - 1];
          const parsedFecha = parseSenaDateParts(rawFecha);
          const fechaHoraJuicio = parsedFecha.fullFormatted || parsedFecha.dateStr || '';

          const funcionario = String(row[idxFuncionario] !== undefined ? row[idxFuncionario] : '').trim();

          const juicioItem = {
            tipoDoc: tipoDoc || 'CC',
            numDoc,
            nombre,
            apellidos,
            nombreCompleto: `${nombre} ${apellidos}`.trim(),
            estadoApr: estadoApr || 'EN FORMACION',
            competencia,
            rap,
            juicio: juicioNormalizado,
            juicioOriginal: juicioVal,
            fechaHoraJuicio,
            funcionario
          };

          allJuiciosRows.push(juicioItem);

          // Deduplicación estricta por Número de Documento del Aprendiz
          if (!aprendicesMap.has(numDoc)) {
            aprendicesMap.set(numDoc, {
              tipoDoc: tipoDoc || 'CC',
              numDoc,
              nombreCompleto: `${nombre} ${apellidos}`.trim(),
              nombre,
              apellidos,
              estado: estadoApr || 'EN FORMACION',
              rapsMap: new Map(), // Para almacenar y deduplicar RAPs únicos de este aprendiz
              raps: [],
              aprobados: 0,
              pendientes: 0,
              noAprobados: 0,
              totalRaps: 0
            });
          }

          const apr = aprendicesMap.get(numDoc);
          
          // Deduplicar RAPs dentro de la ficha de este aprendiz:
          // Un aprendiz tiene solo 1 juicio oficial por cada RAP.
          // Si el reporte contiene reintentos, 'APROBADO' prevalece sobre 'NO APROBADO' y 'POR EVALUAR'.
          const rapKey = rap || `${competencia}_rap_${apr.rapsMap.size + 1}`;
          const existingRap = apr.rapsMap.get(rapKey);
          
          if (!existingRap) {
            apr.rapsMap.set(rapKey, {
              competencia,
              rap,
              juicio: juicioNormalizado,
              fechaHora: fechaHoraJuicio,
              funcionario
            });
          } else if (juicioNormalizado === 'APROBADO' || existingRap.juicio === 'POR EVALUAR') {
            apr.rapsMap.set(rapKey, {
              competencia,
              rap,
              juicio: juicioNormalizado,
              fechaHora: fechaHoraJuicio || existingRap.fechaHora,
              funcionario: funcionario || existingRap.funcionario
            });
          }
        }

        // 4. Consolidar métricas exactas por aprendiz deduplicado
        aprendicesMap.forEach((apr) => {
          apr.raps = Array.from(apr.rapsMap.values());
          apr.totalRaps = apr.raps.length;
          apr.aprobados = apr.raps.filter(r => r.juicio === 'APROBADO').length;
          apr.noAprobados = apr.raps.filter(r => r.juicio === 'NO APROBADO').length;
          apr.pendientes = apr.raps.filter(r => r.juicio === 'POR EVALUAR').length;
          apr.pctAprobado = apr.totalRaps > 0 ? Number(((apr.aprobados / apr.totalRaps) * 100).toFixed(1)) : 0;
          delete apr.rapsMap;
        });

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
