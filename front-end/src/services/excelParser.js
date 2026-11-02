import * as XLSX_PKG from 'xlsx';

/**
 * Servicio de extracción y lectura de reportes Excel de SOFIA Plus / Zajuna (.xls / .xlsx)
 * 
 * Regla de Oro SENA:
 * Un aprendiz aparece N veces (una por cada RAP, ej: 75 RAPs en ADSO).
 * Este parser DEDUPLICA automáticamente para registrar exactamente 1 aprendiz,
 * agrupando sus N juicios de RAPs correspondientes.
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
        const workbook = XLSX.read(data, { type: 'array' });
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

        // 2. Extraer Filas y Deduplicar Aprendices (1 aprendiz -> N RAPs)
        const allJuiciosRows = [];
        const aprendicesMap = new Map();

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;

          const tipoDoc = String(row[0] || '').trim();
          const numDoc = String(row[1] || '').trim();
          const nombre = String(row[2] || '').trim();
          const apellidos = String(row[3] || '').trim();
          const estadoApr = String(row[4] || '').trim();
          const competencia = String(row[5] || '').trim();
          const rap = String(row[6] || '').trim();
          
          let juicioVal = String(row[7] || '').trim();
          if (!juicioVal && row[8] && (String(row[8]).trim() === 'APROBADO' || String(row[8]).trim() === 'NO APROBADO')) {
            juicioVal = String(row[8]).trim();
          }

          let juicioNormalizado = 'POR EVALUAR';
          const jUpper = juicioVal.toUpperCase();
          if (jUpper.includes('APROBADO') && !jUpper.includes('NO')) {
            juicioNormalizado = 'APROBADO';
          } else if (jUpper.includes('NO APROBADO') || jUpper.includes('DEFICIENTE')) {
            juicioNormalizado = 'NO APROBADO';
          }

          const fechaHoraJuicio = String(row[8] || row[9] || '').trim();
          const funcionario = String(row[9] || row[10] || '').trim();

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
