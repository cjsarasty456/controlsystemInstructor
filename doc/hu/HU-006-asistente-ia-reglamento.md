# HU-006: Asistente IA para Consulta del Reglamento del Aprendiz

## Historia de Usuario
Como instructor, quiero contar con un asistente de inteligencia artificial que me permita hacer consultas sobre el reglamento del aprendiz, para obtener respuestas rápidas y precisas sin necesidad de revisar el documento completo.

## Criterios de Aceptación
- El instructor puede realizar preguntas en lenguaje natural sobre el reglamento.
- El asistente responde de forma clara y concita basándose en el contenido del reglamento.
- El asistente muestra la referencia (artículo o sección) de la cual se extrajo la respuesta.
- El instructor puede realizar múltiples consultas en una misma sesión.
- El asistente guarda el historial de consultas realizadas.
- El asistente indica cuando la consulta no tiene relación con el reglamento.

## Funcionalidades del Asistente
- Chat interactivo para realizar preguntas.
- Búsqueda semántica dentro del reglamento.
- Resúmenes de artículos o secciones específicas.
- Sugerencias de preguntas frecuentes.

## Datos de Prueba
- Pregunta: "¿Cuáles son las faltas disciplinarias según el reglamento?"
- Pregunta: "¿Qué dice el reglamento sobre la asistencia obligatoria?"
- Pregunta: "¿Cuáles son los derechos del aprendiz?"
- Pregunta no válida: "¿Qué tiempo hace hoy?" → Respuesta: "Esta pregunta no está relacionada con el reglamento."

## Tecnologías Sugeridas
- **IA:** Modelo de lenguaje (LLM) o embedding para búsqueda semántica.
- **Backend:** Endpoint para procesar consultas y conectar con el servicio de IA.
- **Frontend:** Componente de chat integrado en la app.
