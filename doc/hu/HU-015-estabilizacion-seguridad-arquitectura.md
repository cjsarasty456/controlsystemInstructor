# HU-015: Estabilización de Arquitectura Limpia, Suite de Pruebas y Seguridad Anti-Fugas

## 1. Declaración de Valor de Negocio
**Como** Auditor de Calidad y Oficial de Seguridad de la Factoría de Software SENA  
**Quiero** desacoplar la arquitectura del controlador de fichas, eliminar secretos embebidos en el código fuente e implementar una suite automatizada de pruebas unitarias y de integración  
**Para** garantizar la resiliencia operativa, prevenir fugas de credenciales en repositorios públicos y certificar el cumplimiento normativo ASAF.

---

## 2. Escenarios Gherkin (Criterios de Aceptación)

### Escenario 1: Creación de Ficha a través de DTO Tipado con Inversión de Dependencias
```gherkin
Dado que el cliente envía una solicitud POST a "/api/fichas" con el payload de una ficha válida
Cuando el FichaController procesa la petición
Entonces debe validar el DTO FichaCreateDTO sin invocar directamente FichaRepository
Y debe delegar la persistencia exclusivamente al FichaService
Y debe retornar código HTTP 201 Created con el FichaResponseDTO correspondiente
```

### Escenario 2: Extracción y Protección de Secretos de Base de Datos
```gherkin
Dado que la aplicación Spring Boot o los scripts de backup se inicializan en cualquier ambiente
Cuando leen las credenciales de conexión
Entonces deben consumir obligatoriamente variables de entorno de sistema ("SPRING_DATASOURCE_PASSWORD", "PGPASSWORD")
Y no debe existir ninguna contraseña en texto claro quemada en el código fuente o repositorios
```

### Escenario 3: Verificación Automatizada de Reglas de Deduplicación y Avance de Aprendices
```gherkin
Dado un lote de registros evaluativos de aprendices procedentes de SOFIA Plus
Cuando se ejecuta la suite de pruebas unitarias en JUnit 5
Entonces el JuicioService debe deduplicar exactamente los aprendices por número de documento
Y debe calcular el estado de riesgo académico (Verde, Amarillo, Rojo) con aserciones explícitas bajo patrón AAA
Y la suite debe ejecutarse exitosamente con "mvn test"
```

---

## 3. Definición de Listo (Definition of Ready - DoR)
- [x] Topología de ramas GitFlow establecida (`master`, `dev`, `qa`, `hu-015-*`).
- [x] Contrato OpenAPI / DTOs documentados.
- [x] Variables de entorno documentadas en `.env.example`.

## 4. Definición de Hecho (Definition of Done - DoD)
- [ ] Controladores desacoplados de Repositorios (Zero Layer Leak).
- [ ] Variables de entorno inyectadas sin fallbacks inseguros.
- [ ] Suite de pruebas JUnit 5 implementada y ejecutando en verde.
- [ ] Aprobación de Agentes 6 (QA Backend), 8 (Arquitectura) y 9 (Red Team).
