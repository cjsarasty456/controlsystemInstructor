import * as XLSX_PKG from 'xlsx';

/**
 * Servicio de Gestión y Parseo del Reporte del Proyecto Formativo (HU-009)
 * 
 * Basado en los formatos oficiales del SENA:
 * - GFPI-F-016: Reporte de Proyecto Formativo (SOFIA Plus)
 * - GPFI-F-134: Formato Planeación Pedagógica del Proyecto Formativo (Excel)
 */

// Matriz Base Oficial del Proyecto Formativo 2417180 (ADSO - 228118)
// Extraída directamente de los documentos curriculares y de planeación de Carlos Julio Cadena (CIES Regional Huila)
export const DEFAULT_ADSO_PROJECT = {
  codigoProyecto: '2417180',
  nombreProyecto: 'DESARROLLO DE SOFTWARE INTEGRADOR DE TECNOLOGÍAS ORIENTADAS A SERVICIOS',
  programa: 'ANALISIS Y DESARROLLO DE SOFTWARE',
  codigoPrograma: '228118',
  versionPrograma: '1',
  fechaActualizacion: '16/02/2026',
  origen: 'Matriz Curricular Oficial SENA (GFPI-F-016 / GPFI-F-134)',
  fases: [
    {
      id: 'fase_1',
      nombre: 'Fase 1: Análisis',
      actividades: [
        'Contextualizar en la política, filosofía y metodología institucional.',
        'Determinar las especificaciones funcionales del software.',
        'Definir la estructura lógica del sistema de información.'
      ],
      competencias: [
        {
          codigo: '220501092',
          nombre: 'Establecer requisitos de la solución de software de acuerdo con estándares y procedimiento técnico',
          tipo: 'Técnica',
          raps: ['593077', '593078', '593079', '593080']
        },
        {
          codigo: '220501093',
          nombre: 'Evaluar requisitos de la solución de software de acuerdo con metodologías y estándares',
          tipo: 'Técnica',
          raps: ['593081', '593082', '593083', '593084']
        },
        {
          codigo: '240201530',
          nombre: 'Inducción Institucional',
          tipo: 'Transversal',
          raps: ['593343']
        },
        {
          codigo: '220501046',
          nombre: 'Utilizar herramientas informáticas (TIC)',
          tipo: 'Transversal',
          raps: ['593151', '593152', '593153', '593154']
        },
        {
          codigo: '240201524',
          nombre: 'Desarrollar procesos de comunicación eficaces y asertivos',
          tipo: 'Transversal',
          raps: ['593140', '593141', '593142', '593143']
        },
        {
          codigo: '240201528',
          nombre: 'Razonar cuantitativamente (Matemáticas - Fase Inicial)',
          tipo: 'Transversal',
          raps: ['593144', '593145']
        },
        {
          codigo: '220201501',
          nombre: 'Aplicar principios físicos en la resolución de problemas (Física)',
          tipo: 'Transversal',
          raps: ['593155', '593156', '593157', '593158']
        },
        {
          codigo: '240202501',
          nombre: 'Interactuar en lengua inglesa (Nivel Inicial)',
          tipo: 'Transversal',
          raps: ['593117', '593118']
        }
      ]
    },
    {
      id: 'fase_2',
      nombre: 'Fase 2: Planeación',
      actividades: [
        'Estructurar la propuesta técnica de servicio de tecnología de la información.',
        'Diseñar la solución de software (Arquitectura, modelo de datos y diseño UI/UX).'
      ],
      competencias: [
        {
          codigo: '220501094',
          nombre: 'Estructurar propuesta técnica de servicio de tecnología de la información según requisitos',
          tipo: 'Técnica',
          raps: ['593082', '593083', '593084']
        },
        {
          codigo: '220501095',
          nombre: 'Diseñar la solución de software de acuerdo con procedimientos y requisitos técnicos',
          tipo: 'Técnica',
          raps: ['593085', '593086', '593087', '593088']
        },
        {
          codigo: '240201064',
          nombre: 'Orientar investigación formativa (Fase Formulación RAPs 01 y 02)',
          tipo: 'Transversal',
          raps: ['593120', '593121']
        },
        {
          codigo: '240201526',
          nombre: 'Promover la interacción idónea consigo mismo y los demás (Ética y Paz)',
          tipo: 'Transversal',
          raps: ['593125', '593126', '593127', '593128']
        },
        {
          codigo: '220601501',
          nombre: 'Aplicar prácticas de protección ambiental, SST',
          tipo: 'Transversal',
          raps: ['593130', '593131', '593132', '593133']
        },
        {
          codigo: '230101507',
          nombre: 'Generar hábitos saludables mediante actividad física',
          tipo: 'Transversal',
          raps: ['593135', '593136', '593137', '593138']
        },
        {
          codigo: '240202501',
          nombre: 'Interactuar en lengua inglesa (Nivel Intermedio)',
          tipo: 'Transversal',
          raps: ['593119', '593120']
        }
      ]
    },
    {
      id: 'fase_3',
      nombre: 'Fase 3: Ejecución',
      actividades: [
        'Desarrollar la base de datos y codificar el frontend y backend del software.',
        'Realizar pruebas al software para verificar su funcionalidad.',
        'Desplegar e implantar el software en plataformas de producción.'
      ],
      competencias: [
        {
          codigo: '220501096',
          nombre: 'Desarrollar la solución de software de acuerdo con el diseño y metodologías (1.008 h)',
          tipo: 'Técnica',
          raps: ['593089', '593090', '593091', '593092', '593093']
        },
        {
          codigo: '220501097',
          nombre: 'Implementar la solución de software de acuerdo con requisitos de operación',
          tipo: 'Técnica',
          raps: ['593094', '593095', '593096', '593097']
        },
        {
          codigo: '220501098',
          nombre: 'Controlar la calidad del software (Aseguramiento preventivo en desarrollo - RAP 01)',
          tipo: 'Técnica',
          raps: ['593114']
        },
        {
          codigo: '240201528',
          nombre: 'Razonar cuantitativamente (Matemáticas aplicadas a algoritmos)',
          tipo: 'Transversal',
          raps: ['593146', '593147']
        },
        {
          codigo: '240202501',
          nombre: 'Interactuar en lengua inglesa (Nivel Técnico Avanzado)',
          tipo: 'Transversal',
          raps: ['593121', '593122']
        }
      ]
    },
    {
      id: 'fase_4',
      nombre: 'Fase 4: Evaluación',
      actividades: [
        'Auditar la calidad del software y ejecutar planes de mejora continua.',
        'Evaluación de la investigación aplicada y preparación para etapa productiva.'
      ],
      competencias: [
        {
          codigo: '220501098',
          nombre: 'Controlar la calidad del software (Auditoría final y mejora continua - RAPs 02 y 03)',
          tipo: 'Técnica',
          raps: ['593115', '593116']
        },
        {
          codigo: '240201064',
          nombre: 'Orientar investigación formativa (Cierre y artículo de divulgación - RAPs 03 y 04)',
          tipo: 'Transversal',
          raps: ['593122', '593123']
        },
        {
          codigo: '240202501',
          nombre: 'Interactuar en lengua inglesa (Sustentación de cierre)',
          tipo: 'Transversal',
          raps: ['593123']
        }
      ]
    }
  ]
};

/**
 * Resuelve la Fase Formativa real de un RAP y una Competencia según el Proyecto Formativo
 */
export const getFaseForRapAndCompetencia = (rapStr = '', compStr = '', projectConfig = null) => {
  const normRap = String(rapStr || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normComp = String(compStr || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Si existe configuración personalizada del proyecto formativo, consultar su mapa
  if (projectConfig && projectConfig.rapsMap) {
    // Buscar por código de 6 dígitos
    const codeMatch = normRap.match(/(\d{6})/);
    if (codeMatch && projectConfig.rapsMap[codeMatch[1]]) {
      return projectConfig.rapsMap[codeMatch[1]];
    }
  }

  // 2. Mapeo específico por códigos curriculares de RAPs compartidos
  // Competencia 220501098 (Calidad): RAP 01 está en Ejecución; RAPs 02 y 03 en Evaluación
  if (normComp.includes('220501098') || normComp.includes('CALIDAD')) {
    if (normRap.includes('593114') || normRap.includes('INCORPORAR') || normRap.includes('ASEGURAMIENTO') || normRap.includes('01')) {
      return 'Fase 3: Ejecución';
    }
    return 'Fase 4: Evaluación';
  }

  // Competencia 240201064 (Investigación): RAPs 01 y 02 en Planeación; RAPs 03 y 04 en Evaluación
  if (normComp.includes('240201064') || normComp.includes('INVESTIGACION')) {
    if (normRap.includes('593122') || normRap.includes('593123') || normRap.includes('SOLUCIONES') || normRap.includes('ARGUMENTAR') || normRap.includes('03') || normRap.includes('04')) {
      return 'Fase 4: Evaluación';
    }
    return 'Fase 2: Planeación';
  }

  // Competencia 240201528 (Matemáticas): RAPs 01 y 02 en Análisis; RAPs 03 y 04 en Ejecución
  if (normComp.includes('240201528') || normComp.includes('MATEMATICA') || normComp.includes('CUANTITATIV')) {
    if (normRap.includes('593146') || normRap.includes('593147') || normRap.includes('RESOLVER') || normRap.includes('ACCIONES DE MEJORA') || normRap.includes('03') || normRap.includes('04')) {
      return 'Fase 3: Ejecución';
    }
    return 'Fase 1: Análisis';
  }

  // Competencia 240202501 (Inglés): Distribución progresiva
  if (normComp.includes('240202501') || normComp.includes('INGLESA') || normComp.includes('INGLES')) {
    if (normRap.includes('01') || normRap.includes('02') || normRap.includes('COMPRENDER') || normRap.includes('INTERCAMBIAR')) {
      return 'Fase 1: Análisis';
    }
    if (normRap.includes('03') || normRap.includes('04') || normRap.includes('DESCRIBIR')) {
      return 'Fase 2: Planeación';
    }
    if (normRap.includes('05') || normRap.includes('06') || normRap.includes('TECNIC') || normRap.includes('OPINIONES')) {
      return 'Fase 3: Ejecución';
    }
    return 'Fase 4: Evaluación';
  }

  // 3. Competencias Técnicas con Fase Unívoca
  if (normComp.includes('220501092') || normComp.includes('220501093') || normComp.includes('REQUISITOS') || normComp.includes('LOGICA')) {
    return 'Fase 1: Análisis';
  }
  if (normComp.includes('220501094') || normComp.includes('220501095') || normComp.includes('PROPUESTA') || normComp.includes('DISENO') || normComp.includes('ARQUITECTURA') || normComp.includes('DATOS')) {
    return 'Fase 2: Planeación';
  }
  if (normComp.includes('220501096') || normComp.includes('220501097') || normComp.includes('CONSTRUCCION') || normComp.includes('CODIFICACION') || normComp.includes('IMPLANTACION') || normComp.includes('PRUEBAS')) {
    return 'Fase 3: Ejecución';
  }

  // 4. Competencias Transversales Específicas por Fase según el Proyecto 2417180
  // Fase 1: Inducción, TIC, Comunicación, Física
  if (normComp.includes('240201530') || normComp.includes('INDUCCION') ||
      normComp.includes('220501046') || normComp.includes('TIC') || normComp.includes('HERRAMIENTAS INFORMATICAS') ||
      normComp.includes('240201524') || normComp.includes('COMUNICACION') ||
      normComp.includes('220201501') || normComp.includes('FISICA')) {
    return 'Fase 1: Análisis';
  }

  // Fase 2: Ética, SST, Actividad Física
  if (normComp.includes('240201526') || normComp.includes('ETICA') || normComp.includes('PAZ') ||
      normComp.includes('220601501') || normComp.includes('AMBIENTAL') || normComp.includes('SST') ||
      normComp.includes('230101507') || normComp.includes('FISICA Y HABITOS') || normComp.includes('PSICOMOTRICES')) {
    return 'Fase 2: Planeación';
  }

  return 'Fase 1: Análisis';
};

/**
 * Parseador para cargar archivos de Proyecto Formativo (.xlsx, .xls o .json)
 */
export const parseProjectReportFile = async (file) => {
  return new Promise((resolve, reject) => {
    const XLSX = (typeof window !== 'undefined' && window.XLSX) ? window.XLSX : XLSX_PKG;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          resolve(json);
        } catch (err) {
          reject(new Error("Formato JSON inválido: " + err.message));
        }
      };
      reader.readAsText(file);
      return;
    }

    if (!XLSX) {
      reject(new Error("Biblioteca SheetJS (XLSX) no disponible."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let codigoProyecto = '';
        let nombreProyecto = '';
        let programa = '';
        const rapsMap = {};
        const fasesList = new Set();
        let totalItems = 0;

        // Inspeccionar todas las hojas buscando formato GPFI-F-134
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          rows.forEach((r, idx) => {
            if (!r || r.length === 0) return;

            // Extraer metadatos
            const rowStr = r.join(' ').toUpperCase();
            if (rowStr.includes('CÓDIGO DEL PROYECTO') || rowStr.includes('CODIGO DEL PROYECTO')) {
              for (let col = 1; col < r.length; col++) {
                if (r[col] && String(r[col]).match(/\d{5,8}/)) {
                  codigoProyecto = String(r[col]).trim();
                  break;
                }
              }
            }
            if (rowStr.includes('NOMBRE DEL PROYECTO')) {
              for (let col = 1; col < r.length; col++) {
                if (r[col] && String(r[col]).length > 10) {
                  nombreProyecto = String(r[col]).trim();
                  break;
                }
              }
            }

            // Detectar filas de planeación (Fase, Actividad, Competencia, RAP)
            const col0 = String(r[0] || '').trim().toUpperCase();
            let faseDetectada = null;
            if (col0.includes('ANALIS')) faseDetectada = 'Fase 1: Análisis';
            else if (col0.includes('PLANEA')) faseDetectada = 'Fase 2: Planeación';
            else if (col0.includes('EJECU')) faseDetectada = 'Fase 3: Ejecución';
            else if (col0.includes('EVALU')) faseDetectada = 'Fase 4: Evaluación';

            if (faseDetectada) {
              fasesList.add(faseDetectada);
              // Col 2 suele ser Competencia y Col 3 RAP
              const comp = String(r[2] || '');
              const rap = String(r[3] || '');
              
              if (rap) {
                totalItems++;
                // Extraer código de 6 dígitos del RAP
                const mCode = rap.match(/(\d{6})/);
                if (mCode) {
                  rapsMap[mCode[1]] = faseDetectada;
                }
                rapsMap[rap.trim()] = faseDetectada;
              }
            }
          });
        });

        resolve({
          filename: file.name,
          codigoProyecto: codigoProyecto || '2417180',
          nombreProyecto: nombreProyecto || 'DESARROLLO DE SOFTWARE INTEGRADOR DE TECNOLOGÍAS ORIENTADAS A SERVICIOS',
          programa: programa || 'ANALISIS Y DESARROLLO DE SOFTWARE',
          fechaCarga: new Date().toLocaleString(),
          totalRapsRegistrados: totalItems,
          fasesDetectadas: Array.from(fasesList),
          rapsMap
        });
      } catch (err) {
        reject(new Error("Error al analizar el reporte del proyecto formativo: " + err.message));
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

