/**
 * Utilidades para normalización, formateo y ordenamiento de fechas en el Sistema SENA
 */

/**
 * Descompone y formatea cualquier valor de fecha (Date, serial de Excel, ISO, o string latino)
 * Retorna { dateStr: 'DD/MM/AAAA', timeStr: 'HH:mm', fullFormatted: 'DD/MM/AAAA HH:mm', timestamp: number }
 */
export const parseSenaDateParts = (val) => {
  if (val === null || val === undefined || val === '') {
    return { dateStr: '', timeStr: '', fullFormatted: '', timestamp: 0 };
  }

  // 1. Instancia nativa de Date
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { dateStr: '', timeStr: '', fullFormatted: '', timestamp: 0 };
    }
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    const hh = String(val.getHours()).padStart(2, '0');
    const mm = String(val.getMinutes()).padStart(2, '0');
    const dateStr = `${d}/${m}/${y}`;
    const timeStr = `${hh}:${mm}`;
    return {
      dateStr,
      timeStr: timeStr === '00:00' ? '' : timeStr,
      fullFormatted: timeStr === '00:00' ? dateStr : `${dateStr} ${timeStr}`,
      timestamp: val.getTime()
    };
  }

  // 2. Número serial de fecha de Excel (ej: 45698 o 45698.4375)
  if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)) && String(val).trim().length >= 4 && String(val).trim().length <= 7)) {
    const num = Number(val);
    // Rango válido de fechas Excel (años ~1955 a ~2064)
    if (num > 20000 && num < 60000) {
      // Ajuste de época de Excel: 1899-12-30 (incluye el bug bisiesto de 1900)
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const d = String(date.getUTCDate()).padStart(2, '0');
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const y = date.getUTCFullYear();
        const hh = String(date.getUTCHours()).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const dateStr = `${d}/${m}/${y}`;
        const timeStr = (hh !== '00' || mm !== '00') ? `${hh}:${mm}` : '';
        return {
          dateStr,
          timeStr,
          fullFormatted: timeStr ? `${dateStr} ${timeStr}` : dateStr,
          timestamp: date.getTime()
        };
      }
    }
  }

  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '-') {
    return { dateStr: '', timeStr: '', fullFormatted: '', timestamp: 0 };
  }

  // 3. Formato latino DD/MM/YYYY o DD-MM-YYYY (con o sin hora HH:mm o HH:mm:ss)
  const latMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::\d{1,2})?)?/);
  if (latMatch) {
    const [, d, m, y, hh, mm] = latMatch;
    const dateObj = new Date(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      hh !== undefined ? parseInt(hh, 10) : 0,
      mm !== undefined ? parseInt(mm, 10) : 0
    );
    const dateStr = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    const timeStr = hh !== undefined ? `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')}` : '';
    return {
      dateStr,
      timeStr,
      fullFormatted: timeStr ? `${dateStr} ${timeStr}` : dateStr,
      timestamp: isNaN(dateObj.getTime()) ? 0 : dateObj.getTime()
    };
  }

  // 4. Formato ISO YYYY-MM-DD (con o sin hora)
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::\d{1,2})?)?/);
  if (isoMatch) {
    const [, y, m, d, hh, mm] = isoMatch;
    const dateObj = new Date(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      hh !== undefined ? parseInt(hh, 10) : 0,
      mm !== undefined ? parseInt(mm, 10) : 0
    );
    const dateStr = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    const timeStr = hh !== undefined ? `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')}` : '';
    return {
      dateStr,
      timeStr,
      fullFormatted: timeStr ? `${dateStr} ${timeStr}` : dateStr,
      timestamp: isNaN(dateObj.getTime()) ? 0 : dateObj.getTime()
    };
  }

  // Intento de parseo general si no coincide con los patrones anteriores
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const dateObj = new Date(parsedTimestamp);
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const dateStr = `${d}/${m}/${y}`;
    const timeStr = (hh !== '00' || mm !== '00') ? `${hh}:${mm}` : '';
    return {
      dateStr,
      timeStr,
      fullFormatted: timeStr ? `${dateStr} ${timeStr}` : dateStr,
      timestamp: parsedTimestamp
    };
  }

  return { dateStr: str, timeStr: '', fullFormatted: str, timestamp: 0 };
};

/**
 * Retorna fecha formateada como DD/MM/AAAA o '-'
 */
export const formatSenaDate = (val) => {
  const parts = parseSenaDateParts(val);
  return parts.dateStr || '-';
};

/**
 * Retorna fecha y hora formateada o '-'
 */
export const formatSenaDateTime = (val) => {
  const parts = parseSenaDateParts(val);
  return parts.fullFormatted || '-';
};

