package com.sena.controlsystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.sena.controlsystem.entity.*;
import com.sena.controlsystem.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BackupService {

    private final FichaRepository fichaRepository;
    private final AprendizRepository aprendizRepository;
    private final JuicioDetalleRepository juicioDetalleRepository;
    private final HistorialCargueRepository historialCargueRepository;
    private final EvaluacionReglamentoRepository evaluacionRepository;

    private final ObjectMapper objectMapper;

    // Directorio institucional de respaldos en el repositorio
    private static final String SERVER_BACKUP_DIR = "/home/carlos/trabajo-instructor/05_Administracion_Documental/05_Respaldos_y_Recuperacion";

    public BackupService(
            FichaRepository fichaRepository,
            AprendizRepository aprendizRepository,
            JuicioDetalleRepository juicioDetalleRepository,
            HistorialCargueRepository historialCargueRepository,
            EvaluacionReglamentoRepository evaluacionRepository) {
        this.fichaRepository = fichaRepository;
        this.aprendizRepository = aprendizRepository;
        this.juicioDetalleRepository = juicioDetalleRepository;
        this.historialCargueRepository = historialCargueRepository;
        this.evaluacionRepository = evaluacionRepository;

        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Exporta la base de datos completa en formato JSON estructurado
     */
    @Transactional(readOnly = true)
    public Map<String, Object> exportDatabaseToJson() throws Exception {
        List<FichaEntity> fichas = fichaRepository.findAll();
        List<AprendizEntity> aprendices = aprendizRepository.findAll();
        List<JuicioDetalleEntity> juicios = juicioDetalleRepository.findAll();
        List<HistorialCargueEntity> cargues = historialCargueRepository.findAll();
        List<EvaluacionReglamentoEntity> evaluaciones = evaluacionRepository.findAll();

        Map<String, Object> backup = new LinkedHashMap<>();

        // 1. Metadatos del respaldo
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("sistema", "Sistema de Control de Instructores SENA");
        meta.put("entidad", "SENA — CIES Regional Huila");
        meta.put("versionEsquema", "1.0.0");
        meta.put("motorBaseDatos", "PostgreSQL 18");
        meta.put("fechaExportacion", LocalDateTime.now().toString());
        meta.put("totalFichas", fichas.size());
        meta.put("totalAprendices", aprendices.size());
        meta.put("totalJuicios", juicios.size());
        meta.put("totalCargues", cargues.size());
        meta.put("totalEvaluaciones", evaluaciones.size());
        backup.put("metadata", meta);

        // 2. Fichas
        List<Map<String, Object>> fichasList = new ArrayList<>();
        for (FichaEntity f : fichas) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("numeroFicha", f.getNumeroFicha());
            m.put("programaNombre", f.getProgramaNombre());
            m.put("programaCodigo", f.getProgramaCodigo());
            m.put("programaVersion", f.getProgramaVersion());
            m.put("jornada", f.getJornada());
            m.put("fechaInicio", f.getFechaInicio() != null ? f.getFechaInicio().toString() : null);
            m.put("fechaFin", f.getFechaFin() != null ? f.getFechaFin().toString() : null);
            m.put("sedeCentro", f.getSedeCentro());
            m.put("regional", f.getRegional());
            m.put("estado", f.getEstado());
            m.put("reporteProyectoJson", f.getReporteProyectoJson());
            fichasList.add(m);
        }
        backup.put("fichas", fichasList);

        // 3. Aprendices
        List<Map<String, Object>> aprendicesList = new ArrayList<>();
        for (AprendizEntity a : aprendices) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fichaNumero", a.getFicha().getNumeroFicha());
            m.put("tipoDocumento", a.getTipoDocumento());
            m.put("numeroDocumento", a.getNumeroDocumento());
            m.put("nombres", a.getNombres());
            m.put("apellidos", a.getApellidos());
            m.put("correoInstitucional", a.getCorreoInstitucional());
            m.put("celular", a.getCelular());
            m.put("estadoSena", a.getEstadoSena());
            aprendicesList.add(m);
        }
        backup.put("aprendices", aprendicesList);

        // 4. Historial de cargues
        List<Map<String, Object>> carguesList = new ArrayList<>();
        for (HistorialCargueEntity c : cargues) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fichaNumero", c.getFicha().getNumeroFicha());
            m.put("consecutivoCargue", c.getConsecutivoCargue());
            m.put("nombreArchivoOriginal", c.getNombreArchivoOriginal());
            m.put("hashSha256", c.getHashSha256());
            m.put("fechaReporteSena", c.getFechaReporteSena() != null ? c.getFechaReporteSena().toString() : null);
            m.put("fechaCargue", c.getFechaCargue() != null ? c.getFechaCargue().toString() : null);
            m.put("totalFilasProcesadas", c.getTotalFilasProcesadas());
            m.put("aprendicesAfectados", c.getAprendicesAfectados());
            m.put("juiciosNuevosAprobados", c.getJuiciosNuevosAprobados());
            m.put("juiciosPendientes", c.getJuiciosPendientes());
            m.put("juiciosNoAprobados", c.getJuiciosNoAprobados());
            m.put("subidoPor", c.getSubidoPor());
            m.put("observaciones", c.getObservaciones());
            carguesList.add(m);
        }
        backup.put("historialCargues", carguesList);

        // 5. Juicios evaluativos por RAP
        List<Map<String, Object>> juiciosList = new ArrayList<>();
        for (JuicioDetalleEntity j : juicios) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fichaNumero", j.getFicha().getNumeroFicha());
            m.put("numeroDocumento", j.getAprendiz().getNumeroDocumento());
            m.put("competenciaDenominacion", j.getCompetenciaDenominacion());
            m.put("resultadoAprendizaje", j.getResultadoAprendizaje());
            m.put("juicioEvaluacion", j.getJuicioEvaluacion());
            m.put("fechaHoraJuicio", j.getFechaHoraJuicio() != null ? j.getFechaHoraJuicio().toString() : null);
            m.put("funcionarioRegistro", j.getFuncionarioRegistro());
            juiciosList.add(m);
        }
        backup.put("juicios", juiciosList);

        // 6. Evaluaciones reglamento
        List<Map<String, Object>> evaluacionesList = new ArrayList<>();
        for (EvaluacionReglamentoEntity ev : evaluaciones) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fichaNumero", ev.getFicha().getNumeroFicha());
            m.put("numeroDocumento", ev.getAprendiz().getNumeroDocumento());
            m.put("motivo", ev.getMotivo());
            m.put("gravedad", ev.getGravedad());
            m.put("clasificacionFalta", ev.getClasificacionFalta());
            m.put("medidaRecomendada", ev.getMedidaRecomendada());
            m.put("articulosInvocados", ev.getArticulosInvocados());
            m.put("requiereComite", ev.getRequiereComite());
            m.put("textoCitacion", ev.getTextoCitacion());
            m.put("fechaEvaluacion", ev.getFechaEvaluacion() != null ? ev.getFechaEvaluacion().toString() : null);
            m.put("instructorResponsable", ev.getInstructorResponsable());
            evaluacionesList.add(m);
        }
        backup.put("evaluaciones", evaluacionesList);

        // Guardar copia local automática en el directorio de respaldos
        try {
            saveBackupFileToServer(backup);
        } catch (Exception e) {
            System.err.println("Advertencia al guardar copia local de respaldo: " + e.getMessage());
        }

        return backup;
    }

    /**
     * Guarda una copia del respaldo en el directorio 05_Respaldos_y_Recuperacion del repositorio
     */
    private void saveBackupFileToServer(Map<String, Object> backupData) {
        try {
            Path dirPath = Paths.get(SERVER_BACKUP_DIR);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = String.format("backup_controlsystem_SENA_%s.json", timestamp);
            Path filePath = dirPath.resolve(fileName);
            objectMapper.writeValue(filePath.toFile(), backupData);
        } catch (Exception e) {
            System.err.println("No se pudo escribir archivo de respaldo en servidor: " + e.getMessage());
        }
    }

    /**
     * Importa y restaura una base de datos a partir de un respaldo JSON
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> importDatabaseFromJson(String jsonContent) throws Exception {
        Map<String, Object> backup = objectMapper.readValue(jsonContent, Map.class);

        int fichasRestauradas = 0;
        int aprendicesRestaurados = 0;
        int juiciosRestaurados = 0;
        int carguesRestaurados = 0;
        int evaluacionesRestauradas = 0;

        // 1. Restaurar Fichas
        List<Map<String, Object>> fichasList = (List<Map<String, Object>>) backup.getOrDefault("fichas", Collections.emptyList());
        Map<String, FichaEntity> fichasMap = new HashMap<>();

        for (Map<String, Object> fm : fichasList) {
            String numFicha = (String) fm.get("numeroFicha");
            if (numFicha == null) continue;

            Optional<FichaEntity> existing = fichaRepository.findByNumeroFicha(numFicha);
            FichaEntity f = existing.orElseGet(FichaEntity::new);
            f.setNumeroFicha(numFicha);
            f.setProgramaNombre((String) fm.getOrDefault("programaNombre", "ANALISIS Y DESARROLLO DE SOFTWARE"));
            f.setProgramaCodigo((String) fm.getOrDefault("programaCodigo", "228118"));
            f.setProgramaVersion((String) fm.getOrDefault("programaVersion", "1"));
            f.setJornada((String) fm.getOrDefault("jornada", "PRESENCIAL"));
            
            if (fm.get("fechaInicio") != null) {
                f.setFechaInicio(LocalDate.parse((String) fm.get("fechaInicio")));
            } else if (f.getFechaInicio() == null) {
                f.setFechaInicio(LocalDate.of(2024, 12, 16));
            }

            if (fm.get("fechaFin") != null) {
                f.setFechaFin(LocalDate.parse((String) fm.get("fechaFin")));
            }

            f.setSedeCentro((String) fm.getOrDefault("sedeCentro", "9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS"));
            f.setRegional((String) fm.getOrDefault("regional", "41 - REGIONAL HUILA"));
            f.setEstado((String) fm.getOrDefault("estado", "EN EJECUCION"));
            if (fm.get("reporteProyectoJson") != null) {
                f.setReporteProyectoJson((String) fm.get("reporteProyectoJson"));
            }
            f.setActualizadoEn(LocalDateTime.now());
            f = fichaRepository.save(f);
            fichasMap.put(numFicha, f);
            fichasRestauradas++;
        }

        // Asegurar que fichasMap contenga las fichas si no venían en el backup
        for (FichaEntity f : fichaRepository.findAll()) {
            fichasMap.putIfAbsent(f.getNumeroFicha(), f);
        }

        // 2. Restaurar Aprendices
        List<Map<String, Object>> aprList = (List<Map<String, Object>>) backup.getOrDefault("aprendices", Collections.emptyList());
        Map<String, AprendizEntity> aprendicesMap = new HashMap<>();

        for (Map<String, Object> am : aprList) {
            String numFicha = (String) am.get("fichaNumero");
            String numDoc = (String) am.get("numeroDocumento");
            if (numFicha == null || numDoc == null) continue;

            FichaEntity f = fichasMap.get(numFicha);
            if (f == null) continue;

            Optional<AprendizEntity> existingApr = aprendizRepository.findByNumeroDocumentoAndFichaId(numDoc, f.getId());
            AprendizEntity a = existingApr.orElseGet(AprendizEntity::new);
            a.setFicha(f);
            a.setTipoDocumento((String) am.getOrDefault("tipoDocumento", "CC"));
            a.setNumeroDocumento(numDoc);
            a.setNombres((String) am.getOrDefault("nombres", ""));
            a.setApellidos((String) am.getOrDefault("apellidos", ""));
            a.setCorreoInstitucional((String) am.get("correoInstitucional"));
            a.setCelular((String) am.get("celular"));
            a.setEstadoSena((String) am.getOrDefault("estadoSena", "EN FORMACION"));
            a.setActualizadoEn(LocalDateTime.now());
            a = aprendizRepository.save(a);
            aprendicesMap.put(numFicha + "___" + numDoc, a);
            aprendicesRestaurados++;
        }

        // 3. Restaurar Historial de Cargues
        List<Map<String, Object>> carguesList = (List<Map<String, Object>>) backup.getOrDefault("historialCargues", Collections.emptyList());
        for (Map<String, Object> cm : carguesList) {
            String numFicha = (String) cm.get("fichaNumero");
            FichaEntity f = fichasMap.get(numFicha);
            if (f == null) continue;

            HistorialCargueEntity c = new HistorialCargueEntity();
            c.setFicha(f);
            c.setConsecutivoCargue(cm.get("consecutivoCargue") != null ? (Integer) cm.get("consecutivoCargue") : 1);
            c.setNombreArchivoOriginal((String) cm.getOrDefault("nombreArchivoOriginal", "backup_restaurado.xlsx"));
            c.setHashSha256((String) cm.getOrDefault("hashSha256", ""));
            if (cm.get("fechaReporteSena") != null) c.setFechaReporteSena(LocalDate.parse((String) cm.get("fechaReporteSena")));
            if (cm.get("fechaCargue") != null) c.setFechaCargue(LocalDateTime.parse((String) cm.get("fechaCargue")));
            c.setTotalFilasProcesadas((Integer) cm.getOrDefault("totalFilasProcesadas", 0));
            c.setAprendicesAfectados((Integer) cm.getOrDefault("aprendicesAfectados", 0));
            c.setJuiciosNuevosAprobados((Integer) cm.getOrDefault("juiciosNuevosAprobados", 0));
            c.setJuiciosPendientes((Integer) cm.getOrDefault("juiciosPendientes", 0));
            c.setJuiciosNoAprobados((Integer) cm.getOrDefault("juiciosNoAprobados", 0));
            c.setSubidoPor((String) cm.getOrDefault("subidoPor", "Carlos Julio Cadena"));
            c.setObservaciones((String) cm.getOrDefault("observaciones", "Restaurado desde copia de seguridad."));
            historialCargueRepository.save(c);
            carguesRestaurados++;
        }

        // 4. Restaurar Juicios Evaluativos por RAP
        List<Map<String, Object>> juiciosList = (List<Map<String, Object>>) backup.getOrDefault("juicios", Collections.emptyList());
        for (Map<String, Object> jm : juiciosList) {
            String numFicha = (String) jm.get("fichaNumero");
            String numDoc = (String) jm.get("numeroDocumento");
            String rap = (String) jm.get("resultadoAprendizaje");
            if (numFicha == null || numDoc == null || rap == null) continue;

            FichaEntity f = fichasMap.get(numFicha);
            AprendizEntity a = aprendicesMap.get(numFicha + "___" + numDoc);
            if (f == null || a == null) continue;

            Optional<JuicioDetalleEntity> existingJ = juicioDetalleRepository
                    .findByAprendizIdAndResultadoAprendizaje(a.getId(), rap);

            JuicioDetalleEntity j = existingJ.orElseGet(JuicioDetalleEntity::new);
            j.setFicha(f);
            j.setAprendiz(a);
            j.setCompetenciaDenominacion((String) jm.getOrDefault("competenciaDenominacion", "COMPETENCIA"));
            j.setResultadoAprendizaje(rap);
            j.setJuicioEvaluacion((String) jm.getOrDefault("juicioEvaluacion", "POR EVALUAR"));

            if (jm.get("fechaHoraJuicio") != null) {
                try {
                    j.setFechaHoraJuicio(LocalDateTime.parse((String) jm.get("fechaHoraJuicio")));
                } catch (Exception ignored) {
                    j.setFechaHoraJuicio(LocalDateTime.now());
                }
            }
            j.setFuncionarioRegistro((String) jm.getOrDefault("funcionarioRegistro", "Carlos Julio Cadena (Instructor)"));
            j.setActualizadoEn(LocalDateTime.now());
            juicioDetalleRepository.save(j);
            juiciosRestaurados++;
        }

        // 5. Restaurar Evaluaciones del Reglamento
        List<Map<String, Object>> evalList = (List<Map<String, Object>>) backup.getOrDefault("evaluaciones", Collections.emptyList());
        for (Map<String, Object> em : evalList) {
            String numFicha = (String) em.get("fichaNumero");
            String numDoc = (String) em.get("numeroDocumento");
            if (numFicha == null || numDoc == null) continue;

            FichaEntity f = fichasMap.get(numFicha);
            AprendizEntity a = aprendicesMap.get(numFicha + "___" + numDoc);
            if (f == null || a == null) continue;

            EvaluacionReglamentoEntity ev = new EvaluacionReglamentoEntity();
            ev.setFicha(f);
            ev.setAprendiz(a);
            ev.setMotivo((String) em.getOrDefault("motivo", "ACADEMICO"));
            ev.setGravedad((String) em.getOrDefault("gravedad", "GRAVE"));
            ev.setClasificacionFalta((String) em.getOrDefault("clasificacionFalta", ""));
            ev.setMedidaRecomendada((String) em.getOrDefault("medidaRecomendada", ""));
            ev.setArticulosInvocados((String) em.getOrDefault("articulosInvocados", ""));
            ev.setRequiereComite((Boolean) em.getOrDefault("requiereComite", true));
            ev.setTextoCitacion((String) em.getOrDefault("textoCitacion", ""));
            if (em.get("fechaEvaluacion") != null) ev.setFechaEvaluacion(LocalDate.parse((String) em.get("fechaEvaluacion")));
            ev.setInstructorResponsable((String) em.getOrDefault("instructorResponsable", "Carlos Julio Cadena"));
            evaluacionRepository.save(ev);
            evaluacionesRestauradas++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mensaje", "Copia de seguridad restaurada exitosamente en PostgreSQL.");
        result.put("fichasRestauradas", fichasRestauradas);
        result.put("aprendicesRestaurados", aprendicesRestaurados);
        result.put("juiciosRestaurados", juiciosRestaurados);
        result.put("carguesRestaurados", carguesRestaurados);
        result.put("evaluacionesRestauradas", evaluacionesRestauradas);
        result.put("timestamp", LocalDateTime.now().toString());
        return result;
    }

    /**
     * Genera un volcado nativo SQL de la base de datos usando pg_dump
     */
    public String exportDatabaseToSql() throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
                "pg_dump",
                "-h", "localhost",
                "-U", "postgres",
                "-d", "controlsystem_db",
                "--clean",
                "--if-exists"
        );
        pb.environment().put("PGPASSWORD", "postgres");

        Process process = pb.start();
        String sqlOutput;
        try (InputStream is = process.getInputStream()) {
            sqlOutput = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("pg_dump falló con código de salida: " + exitCode);
        }

        // Guardar copia local en el servidor
        try {
            Path dirPath = Paths.get(SERVER_BACKUP_DIR);
            if (!Files.exists(dirPath)) Files.createDirectories(dirPath);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            Path filePath = dirPath.resolve(String.format("backup_controlsystem_SENA_%s.sql", timestamp));
            Files.writeString(filePath, sqlOutput, StandardCharsets.UTF_8);
        } catch (Exception ignored) {}

        return sqlOutput;
    }

    /**
     * Lista los respaldos existentes guardados en el directorio del servidor
     */
    public List<Map<String, Object>> listServerBackups() {
        List<Map<String, Object>> list = new ArrayList<>();
        File dir = new File(SERVER_BACKUP_DIR);
        if (!dir.exists() || !dir.isDirectory()) return list;

        File[] files = dir.listFiles((d, name) -> name.startsWith("backup_controlsystem") && (name.endsWith(".json") || name.endsWith(".sql") || name.endsWith(".sql.gz")));
        if (files == null) return list;

        Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));

        for (File f : files) {
            Map<String, Object> m = new HashMap<>();
            m.put("fileName", f.getName());
            m.put("sizeBytes", f.length());
            m.put("sizeReadable", formatBytes(f.length()));
            m.put("lastModified", new Date(f.lastModified()).toString());
            m.put("isSql", f.getName().endsWith(".sql") || f.getName().endsWith(".sql.gz"));
            list.add(m);
        }
        return list;
    }

    /**
     * Lee un respaldo específico del servidor para restaurarlo
     */
    public Map<String, Object> restoreServerBackup(String fileName) throws Exception {
        Path filePath = Paths.get(SERVER_BACKUP_DIR).resolve(fileName);
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Archivo de respaldo no encontrado en servidor: " + fileName);
        }

        if (fileName.endsWith(".json")) {
            String content = Files.readString(filePath, StandardCharsets.UTF_8);
            return importDatabaseFromJson(content);
        } else if (fileName.endsWith(".sql")) {
            ProcessBuilder pb = new ProcessBuilder(
                    "psql",
                    "-h", "localhost",
                    "-U", "postgres",
                    "-d", "controlsystem_db",
                    "-f", filePath.toString()
            );
            pb.environment().put("PGPASSWORD", "postgres");
            Process p = pb.start();
            int exit = p.waitFor();
            if (exit != 0) throw new RuntimeException("psql falló al restaurar: " + exit);

            return Map.of("mensaje", "Respaldo SQL nativo restaurado exitosamente en PostgreSQL.", "fileName", fileName);
        }

        throw new IllegalArgumentException("Formato no soportado: " + fileName);
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
