/**
 * Servicio del Reglamento del Aprendiz SENA y Motor de Evaluación Normativa (HU-005)
 * 
 * Basado en el Acuerdo 007 de 2012 (Reglamento del Aprendiz SENA) y circulares vigentes.
 */

export const DEFAULT_REGLAMENTO_INFO = {
  norma: 'Acuerdo 007 de 2012 — Reglamento del Aprendiz SENA',
  titulo: 'Reglamento del Aprendiz del Servicio Nacional de Aprendizaje SENA',
  version: '2026 Vigente',
  fechaCarga: '20/08/2026',
  tamano: '385 KB',
  tipoDocumento: 'Normativa Institucional Oficial',
  capitulos: [
    {
      capitulo: 'Capítulo II',
      titulo: 'Derechos del Aprendiz',
      articulos: [
        {
          numero: 'Artículo 7',
          nombre: 'Derechos del Aprendiz SENA',
          resumen: 'Recibir formación profesional integral de calidad; disponer de los recursos didácticos e infraestructura; ser escuchado y atendido en peticiones; conocer oportunamente las evaluaciones y planes de mejoramiento.'
        }
      ]
    },
    {
      capitulo: 'Capítulo III',
      titulo: 'Deberes del Aprendiz',
      articulos: [
        {
          numero: 'Artículo 9',
          nombre: 'Deberes del Aprendiz SENA',
          resumen: 'Cumplir con todas las actividades formativas del programa; asistir puntual y regularmente a las sesiones presenciales y virtuales; portar el carné institucional; respetar a la comunidad educativa y cuidar los bienes del centro.'
        }
      ]
    },
    {
      capitulo: 'Capítulo IV',
      titulo: 'Prohibiciones',
      articulos: [
        {
          numero: 'Artículo 10',
          nombre: 'Prohibiciones para los Aprendices',
          resumen: 'Plagiar o cometer fraude en evaluaciones o evidencias; ausentarse sin justificación; alterar o falsificar documentos institucionales; ingresar en estado de embriaguez o sustancias psicoactivas; comercializar bienes sin autorización.'
        }
      ]
    },
    {
      capitulo: 'Capítulo VII',
      titulo: 'Trámite de Novedades, Inasistencias y Deserción',
      articulos: [
        {
          numero: 'Artículo 22',
          nombre: 'Participación y Deserción del Proceso Formativo',
          resumen: 'El aprendiz debe justificar las inasistencias dentro de los 3 días hábiles siguientes ante el instructor. Se configura deserción cuando injustificadamente no asiste durante 3 días consecutivos o acumula inasistencias reiteradas.'
        }
      ]
    },
    {
      capitulo: 'Capítulo VIII',
      titulo: 'Faltas Académicas y Disciplinarias',
      articulos: [
        {
          numero: 'Artículo 24',
          nombre: 'Clasificación de las Faltas',
          resumen: 'Las faltas pueden ser Académicas (incumplimiento en entrega de evidencias o no logro de RAPs) o Disciplinarias (infracción de deberes y prohibiciones).'
        },
        {
          numero: 'Artículo 25',
          nombre: 'Criterios para Calificar la Falta',
          resumen: 'Se califica como Leve, Grave o Gravísima según: daño causado, grado de culpabilidad, reiteración de la conducta y antecedentes disciplinarios.'
        }
      ]
    },
    {
      capitulo: 'Capítulo IX',
      titulo: 'Medidas Formativas y Sanciones',
      articulos: [
        {
          numero: 'Artículo 27',
          nombre: 'Medidas Formativas',
          resumen: 'Llamado de atención verbal; Llamado de atención escrito con Plan de Mejoramiento Académico o Disciplinario concertado con el instructor (plazo máximo de 30 días calendario).'
        },
        {
          numero: 'Artículo 28',
          nombre: 'Sanciones Aplicables',
          resumen: '1. Condicionamiento de la matrícula (pérdida de estímulos). 2. Cancelación de la matrícula con inhabilidad para registrarse en el SENA de 6 meses a 2 años.'
        }
      ]
    },
    {
      capitulo: 'Capítulo X',
      titulo: 'Procedimiento de Comité de Evaluación y Seguimiento',
      articulos: [
        {
          numero: 'Artículo 29',
          nombre: 'Comité de Evaluación y Seguimiento',
          resumen: 'Órgano asesor del Subdirector de Centro para evaluar informes de instructores, analizar el desempeño y recomendar medidas formativas o sanciones.'
        },
        {
          numero: 'Artículo 30',
          nombre: 'Procedimiento para la Aplicación de Sanciones (Descargos)',
          resumen: 'Citación formal por escrito con mínimo 3 días hábiles de anticipación para presentación de descargos orales o escritos y presentación de pruebas.'
        }
      ]
    }
  ]
};

/**
 * Motor Evaluador de Aprendices según el Reglamento del Aprendiz
 */
export const evaluarCasoAprendiz = ({
  aprendiz,
  ficha,
  motivo, // 'ACADEMICO', 'INASISTENCIA', 'DISCIPLINARIO', 'DESERCION'
  descripcionFalta,
  rapsNoAprobadosCount = 0,
  inasistenciasInjustificadas = 0,
  tieneAntecedentes = false,
  esReincidente = false
}) => {
  let gravedad = 'Leve';
  let clasificacion = 'Falta Académica';
  let articulosInvocados = [];
  let medidaRecomendada = '';
  let requiereComite = false;

  if (motivo === 'DESERCION' || inasistenciasInjustificadas >= 3) {
    clasificacion = 'Deserción Formativa (Art. 22 Núm. 4)';
    gravedad = 'Gravísima';
    medidaRecomendada = 'Inicio de Trámite de Cancelación de Matrícula por Deserción (Notificación por 5 días para justificar antes de resolución de Subdirección).';
    articulosInvocados = [
      { articulo: 'Artículo 9', texto: 'Deber de asistir puntual y regularmente a las actividades programadas.' },
      { articulo: 'Artículo 22 Numeral 4', texto: 'Inasistencia injustificada durante 3 días consecutivos a las actividades del proceso formativo.' },
      { articulo: 'Artículo 28 Numeral 2', texto: 'Cancelación de la matrícula por deserción justificada con acto administrativo.' }
    ];
    requiereComite = true;
  } else if (motivo === 'ACADEMICO' || rapsNoAprobadosCount > 0) {
    clasificacion = 'Falta Académica (Bajo Rendimiento / RAPs no aprobados)';
    if (rapsNoAprobadosCount >= 3 || tieneAntecedentes || esReincidente) {
      gravedad = 'Grave';
      medidaRecomendada = 'Citación a Comité de Evaluación y Seguimiento para Condicionamiento o Cancelación de Matrícula tras incumplimiento de plan de mejoramiento previo.';
      requiereComite = true;
    } else {
      gravedad = 'Leve';
      medidaRecomendada = 'Firma de Plan de Mejoramiento Académico concertado (Art. 27) con plazo máximo de cumplimiento no superior a 30 días calendario.';
      requiereComite = false;
    }
    articulosInvocados = [
      { articulo: 'Artículo 7', texto: 'Derecho a solicitar evaluación oportuna y planes de mejoramiento.' },
      { articulo: 'Artículo 9 Numeral 1', texto: 'Deber de cumplir cabalmente con las actividades de aprendizaje y evidencias del programa.' },
      { articulo: 'Artículo 24', texto: 'Falta académica por incumplimiento en el logro de los resultados de aprendizaje.' },
      { articulo: 'Artículo 27', texto: 'Medidas Formativas: Plan de mejoramiento académico como medida pedagógica.' },
      ...(requiereComite ? [{ articulo: 'Artículo 29', texto: 'Competencia del Comité de Evaluación para emitir recomendación motivada.' }] : [])
    ];
  } else if (motivo === 'INASISTENCIA') {
    clasificacion = 'Incumplimiento de Asistencia (Art. 9 y 22)';
    if (inasistenciasInjustificadas >= 2) {
      gravedad = 'Grave';
      medidaRecomendada = 'Llamado de atención escrito con advertencia de deserción y citación preventiva ante coordinación académica.';
      requiereComite = false;
    } else {
      gravedad = 'Leve';
      medidaRecomendada = 'Llamado de atención verbal y registro en bitácora de seguimiento del instructor.';
      requiereComite = false;
    }
    articulosInvocados = [
      { articulo: 'Artículo 9 Numeral 2', texto: 'Deber de justificar ausencias dentro de los 3 días hábiles siguientes a la ocurrencia.' },
      { articulo: 'Artículo 22', texto: 'Cálculo de porcentaje de asistencia y causales de retiro del proceso formativo.' }
    ];
  } else {
    // DISCIPLINARIO
    clasificacion = 'Falta Disciplinaria';
    if (tieneAntecedentes || esReincidente) {
      gravedad = 'Gravísima';
      medidaRecomendada = 'Citación Formal a Comité de Evaluación y Seguimiento con pliego de cargos para Condicionamiento o Cancelación de Matrícula.';
      requiereComite = true;
    } else {
      gravedad = 'Grave';
      medidaRecomendada = 'Llamado de atención escrito con Plan de Mejoramiento Disciplinario concertado con copia a la hoja de vida institucional.';
      requiereComite = false;
    }
    articulosInvocados = [
      { articulo: 'Artículo 9', texto: 'Deberes generales de convivencia y respeto institucional.' },
      { articulo: 'Artículo 10', texto: 'Prohibiciones expresas para los aprendices en ambientes presenciales y virtuales.' },
      { articulo: 'Artículo 25', texto: 'Calificación de la falta considerando antecedentes e impacto en la comunidad formativa.' },
      { articulo: 'Artículo 27 / 28', texto: 'Aplicación de medidas formativas o sancionatorias proporcionales a la falta.' }
    ];
  }

  // Generar borrador del Acta o Citación a Comité
  const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const nombreAprendiz = aprendiz ? (aprendiz.nombreCompleto || `${aprendiz.nombre} ${aprendiz.apellidos}`.trim()) : 'APRENDIZ';
  const numDoc = aprendiz ? aprendiz.numDoc : 'SIN IDENTIFICACIÓN';
  const numFicha = ficha ? ficha.numero : '3145556';
  const nombrePrograma = ficha ? ficha.programa : 'ANALISIS Y DESARROLLO DE SOFTWARE';

  const textoCitacion = `
================================================================================
SERVICIO NACIONAL DE APRENDIZAJE — SENA
CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS (CIES) — REGIONAL HUILA
COMITÉ DE EVALUACIÓN Y SEGUIMIENTO ACADÉMICO / DISCIPLINARIO
================================================================================

FECHA DE EMISIÓN: ${fechaHoy}
FICHA DE CARACTERIZACIÓN: ${numFicha}
PROGRAMA DE FORMACIÓN: ${nombrePrograma}
APRENDIZ: ${nombreAprendiz}
TIPO Y NÚMERO DE DOCUMENTO: ${aprendiz ? (aprendiz.tipoDoc || 'CC') : 'CC'} ${numDoc}
ESTADO DEL APRENDIZ: ${aprendiz ? aprendiz.estado : 'EN FORMACIÓN'}

--------------------------------------------------------------------------------
1. MOTIVO Y CLASIFICACIÓN DE LA NOVEDAD
--------------------------------------------------------------------------------
Clasificación de la falta: ${clasificacion}
Calificación de gravedad estimada: ${gravedad.toUpperCase()}
Medida reglamentaria recomendada: ${medidaRecomendada}
Requiere comparecencia ante Comité: ${requiereComite ? 'SÍ (Artículo 29 y 30)' : 'NO (Manejo Directo con Instructor)'}

--------------------------------------------------------------------------------
2. RELACIÓN CIRCUNSTANCIADA DE LOS HECHOS
--------------------------------------------------------------------------------
${descripcionFalta || 'Se evidencia incumplimiento reiterado en las actividades y resultados de aprendizaje programados para la presente fase formativa.'}
${inasistenciasInjustificadas > 0 ? `\n• Inasistencias injustificadas acumuladas: ${inasistenciasInjustificadas} sesiones.` : ''}
${rapsNoAprobadosCount > 0 ? `\n• Resultados de Aprendizaje no aprobados / pendientes críticos: ${rapsNoAprobadosCount} RAPs.` : ''}

--------------------------------------------------------------------------------
3. FUNDAMENTO NORMATIVO DEL REGLAMENTO DEL APRENDIZ (ACUERDO 007 DE 2012)
--------------------------------------------------------------------------------
${articulosInvocados.map(a => `• ${a.articulo}: ${a.texto}`).join('\n')}

--------------------------------------------------------------------------------
4. PLIEGO DE CARGOS Y DERECHO AL DEBIDO PROCESO (ARTÍCULO 30)
--------------------------------------------------------------------------------
En cumplimiento del Artículo 30 del Reglamento del Aprendiz, se le concede al aprendiz 
un término improrrogable de tres (3) días hábiles contados a partir del recibo de esta 
comunicación para presentar sus descargos por escrito ante el Comité de Evaluación y 
aportar las pruebas que considere pertinentes para su defensa.

EMITIDO POR:
Carlos Julio Cadena
Instructor Técnico — Red de Informática, Diseño y Desarrollo de Software
Centro de la Industria, la Empresa y los Servicios — Regional Huila
================================================================================
`.trim();

  return {
    aprendiz,
    ficha,
    motivo,
    gravedad,
    clasificacion,
    medidaRecomendada,
    articulosInvocados,
    requiereComite,
    textoCitacion,
    fechaEvaluacion: fechaHoy
  };
};

