# HU-005: Carga del Reglamento del Aprendiz y Motor de Evaluación Normativa

## Historia de Usuario
**Como** instructor técnico y líder de ficha del SENA,  
**Quiero** cargar el documento oficial del Reglamento del Aprendiz (Acuerdo 007 de 2012 / Versión Vigente) y contar con un módulo para evaluar casos de aprendices (rendimiento académico deficiente, inasistencias o faltas disciplinarias),  
**Para** emitir dictámenes normativos sustentados, tipificar las faltas (Leves, Graves o Gravísimas), recomendar planes de mejoramiento y generar formalmente las citaciones a Comité de Evaluación y Seguimiento según los artículos vigentes.

---

## Criterios de Aceptación

### CA-01: Carga y Almacenamiento del Reglamento
* El instructor puede subir el archivo oficial del Reglamento del Aprendiz en formato `.pdf` o `.txt`.
* El sistema guarda el historial del documento: nombre del archivo, fecha de carga, versión (Acuerdo 007 de 2012 / 2026), y tamaño.
* Se proporciona pre-cargado el articulado oficial vigente del SENA con sus capítulos e índices clave.

### CA-02: Módulo de Auditoría y Detección de Casos por Ficha
* El sistema analiza la población de aprendices "EN FORMACIÓN" de la ficha activa y genera alertas preventivas:
  * **Alerta de Deserción por Inasistencia (Art. 22 Núm. 4):** Aprendices con 3 días consecutivos o acumulados de inasistencia sin justificación comprobada.
  * **Alerta de Bajo Rendimiento Académico (Art. 22 Núm. 3 y Art. 29):** Aprendices con uno o más Resultados de Aprendizaje en estado `"NO APROBADO"` o que acumulen juicios pendientes tras vencerse los plazos de la fase.

### CA-03: Evaluador de Casos y Tipificación de Faltas (Simulador de Comité)
* El instructor puede seleccionar a un aprendiz y diligenciar una evaluación normativa:
  * **Tipo de Falta:** Académica (no presentación de evidencias, juicio no aprobado, fraude) o Disciplinaria (violación a deberes Art. 9, incurrir en prohibiciones Art. 10).
  * **Criterios de Gravedad (Art. 25):** Daño causado, reincidencia, grado de culpabilidad, antecedentes del aprendiz.
  * **Tipificación Automática:** Clasifica la falta como **Leve**, **Grave** o **Gravísima**.
  * **Medida Formativa o Sanción Recomendada:**
    * *Llamado de atención escrito con Plan de Mejoramiento Académico o Disciplinario* (Art. 27).
    * *Condicionamiento de Matrícula* (Art. 28 Numeral 1).
    * *Cancelación de Matrícula* (Art. 28 Numeral 2).
  * **Fundamentación Jurídica:** Cita automáticamente los artículos y numerales aplicables del reglamento cargado.

### CA-04: Generador de Citación a Comité de Evaluación y Seguimiento (Art. 29 y 30)
* Genera el formato de citación oficial con pliego de cargos listo para imprimir o enviar por correo institucional:
  * Datos de la ficha, fecha, centro y regional.
  * Identificación completa del aprendiz.
  * Descripción circunstanciada de los hechos.
  * Relación de RAPs afectados / inasistencias acumuladas.
  * Artículos del reglamento infringidos.
  * Fecha límite para presentación de descargos (mínimo 3 días hábiles según Art. 30).
