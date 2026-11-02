package com.sena.controlsystem.service;

import com.sena.controlsystem.entity.AprendizEntity;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.entity.HistorialCargueEntity;
import com.sena.controlsystem.entity.JuicioDetalleEntity;
import com.sena.controlsystem.repository.AprendizRepository;
import com.sena.controlsystem.repository.FichaRepository;
import com.sena.controlsystem.repository.HistorialCargueRepository;
import com.sena.controlsystem.repository.JuicioDetalleRepository;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class JuicioService {

    private final FichaRepository fichaRepository;
    private final AprendizRepository aprendizRepository;
    private final JuicioDetalleRepository juicioDetalleRepository;
    private final HistorialCargueRepository historialCargueRepository;

    public JuicioService(
            FichaRepository fichaRepository,
            AprendizRepository aprendizRepository,
            JuicioDetalleRepository juicioDetalleRepository,
            HistorialCargueRepository historialCargueRepository) {
        this.fichaRepository = fichaRepository;
        this.aprendizRepository = aprendizRepository;
        this.juicioDetalleRepository = juicioDetalleRepository;
        this.historialCargueRepository = historialCargueRepository;
    }

    @Transactional
    public Map<String, Object> procesarArchivoSofiaExcel(Long fichaId, MultipartFile file) throws Exception {
        FichaEntity ficha = fichaRepository.findById(fichaId)
                .orElseThrow(() -> new IllegalArgumentException("Ficha no encontrada con id: " + fichaId));

        byte[] fileBytes = file.getBytes();
        String sha256 = calculateSHA256(fileBytes);

        List<RowData> rawRows = new ArrayList<>();
        LocalDate fechaReporte = LocalDate.now();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            int headerRowIndex = 12;
            for (int r = 0; r <= Math.min(sheet.getLastRowNum(), 25); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String colA = formatter.formatCellValue(row.getCell(0)).toLowerCase();
                String colB = formatter.formatCellValue(row.getCell(1));
                if (colA.contains("fecha del reporte")) {
                    try {
                        fechaReporte = parseDate(colB);
                    } catch (Exception ignored) {}
                }

                // Detectar encabezados
                StringBuilder rowSb = new StringBuilder();
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    rowSb.append(formatter.formatCellValue(row.getCell(c))).append(" ");
                }
                String rowText = rowSb.toString().toLowerCase();
                if (rowText.contains("documento") || rowText.contains("juicio de evaluación") || rowText.contains("competencia")) {
                    headerRowIndex = r;
                }
            }

            // Identificar índices de columnas
            Row hRow = sheet.getRow(headerRowIndex);
            int idxTipoDoc = 0;
            int idxNumDoc = 1;
            int idxNombre = 2;
            int idxApellidos = 3;
            int idxEstado = 4;
            int idxCompetencia = 5;
            int idxRap = 6;
            int idxJuicio = 7;
            int idxFecha = 8;
            int idxFuncionario = 9;

            if (hRow != null) {
                for (int c = 0; c < hRow.getLastCellNum(); c++) {
                    String h = formatter.formatCellValue(hRow.getCell(c)).toLowerCase().trim();
                    if (h.contains("tipo") && h.contains("doc")) idxTipoDoc = c;
                    else if (h.contains("número") || h.contains("numero") || (h.contains("documento") && !h.contains("tipo"))) idxNumDoc = c;
                    else if (h.contains("nombre")) idxNombre = c;
                    else if (h.contains("apellido")) idxApellidos = c;
                    else if (h.contains("estado")) idxEstado = c;
                    else if (h.contains("competencia")) idxCompetencia = c;
                    else if (h.contains("resultado") || h.contains("rap")) idxRap = c;
                    else if (h.contains("juicio")) idxJuicio = c;
                    else if (h.contains("fecha") || h.contains("asentamiento") || h.contains("registro")) idxFecha = c;
                    else if (h.contains("funcionario") || h.contains("instructor")) idxFuncionario = c;
                }
            }

            // Leer filas de aprendices y juicios
            for (int r = headerRowIndex + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String numDoc = formatter.formatCellValue(row.getCell(idxNumDoc)).trim();
                if (numDoc.isEmpty()) continue;

                RowData d = new RowData();
                d.tipoDoc = formatter.formatCellValue(row.getCell(idxTipoDoc)).trim();
                d.numDoc = numDoc;
                d.nombre = formatter.formatCellValue(row.getCell(idxNombre)).trim();
                d.apellidos = formatter.formatCellValue(row.getCell(idxApellidos)).trim();
                d.estado = formatter.formatCellValue(row.getCell(idxEstado)).trim();
                d.competencia = formatter.formatCellValue(row.getCell(idxCompetencia)).trim();
                d.rap = formatter.formatCellValue(row.getCell(idxRap)).trim();
                
                String rawJuicio = formatter.formatCellValue(row.getCell(idxJuicio)).trim().toUpperCase();
                if (rawJuicio.contains("APROBADO") && !rawJuicio.contains("NO")) {
                    d.juicio = "APROBADO";
                } else if (rawJuicio.contains("NO APROBADO") || rawJuicio.contains("DEFICIENTE")) {
                    d.juicio = "NO APROBADO";
                } else {
                    d.juicio = "POR EVALUAR";
                }

                Cell dateCell = row.getCell(idxFecha);
                d.fechaJuicio = extractDate(dateCell, formatter);

                d.funcionario = formatter.formatCellValue(row.getCell(idxFuncionario)).trim();
                rawRows.add(d);
            }
        }

        // DEDUPLICACIÓN ESTRICTA Y UPSERT (RN-01 y RN-02)
        Map<String, AprendizEntity> aprendicesGuardados = new HashMap<>();
        int juiciosAprobadosTotal = 0;
        int juiciosPendientesTotal = 0;
        int juiciosNoAprobadosTotal = 0;
        int juiciosNuevosAprobados = 0;

        for (RowData r : rawRows) {
            // Upsert Aprendiz único por número de documento
            AprendizEntity apr = aprendicesGuardados.computeIfAbsent(r.numDoc, k -> {
                Optional<AprendizEntity> existing = aprendizRepository.findByNumeroDocumentoAndFichaId(r.numDoc, ficha.getId());
                AprendizEntity entity = existing.orElseGet(AprendizEntity::new);
                entity.setFicha(ficha);
                entity.setTipoDocumento(r.tipoDoc.isEmpty() ? "CC" : r.tipoDoc);
                entity.setNumeroDocumento(r.numDoc);
                entity.setNombres(r.nombre);
                entity.setApellidos(r.apellidos);
                if (!r.estado.isEmpty()) entity.setEstadoSena(r.estado);
                entity.setActualizadoEn(LocalDateTime.now());
                return aprendizRepository.save(entity);
            });

            // Upsert Juicio por RAP
            Optional<JuicioDetalleEntity> existingJuicio = juicioDetalleRepository
                    .findByAprendizIdAndResultadoAprendizaje(apr.getId(), r.rap);

            JuicioDetalleEntity jEntity = existingJuicio.orElseGet(JuicioDetalleEntity::new);
            boolean eraPrevioNoAprobado = existingJuicio.map(j -> !"APROBADO".equals(j.getJuicioEvaluacion())).orElse(true);

            jEntity.setFicha(ficha);
            jEntity.setAprendiz(apr);
            jEntity.setCompetenciaDenominacion(r.competencia);
            jEntity.setResultadoAprendizaje(r.rap);
            jEntity.setJuicioEvaluacion(r.juicio);
            jEntity.setFechaHoraJuicio(r.fechaJuicio != null ? r.fechaJuicio : LocalDateTime.now());
            jEntity.setFuncionarioRegistro(r.funcionario.isEmpty() ? "Carlos Julio Cadena (Instructor)" : r.funcionario);
            jEntity.setActualizadoEn(LocalDateTime.now());
            juicioDetalleRepository.save(jEntity);

            if ("APROBADO".equals(r.juicio)) {
                juiciosAprobadosTotal++;
                if (eraPrevioNoAprobado) juiciosNuevosAprobados++;
            } else if ("NO APROBADO".equals(r.juicio)) {
                juiciosNoAprobadosTotal++;
            } else {
                juiciosPendientesTotal++;
            }
        }

        // REGISTRAR HISTORIAL DE CARGUE INMUTABLE (RN-03)
        int nextConsecutivo = historialCargueRepository.countByFichaId(ficha.getId()) + 1;
        HistorialCargueEntity cargue = new HistorialCargueEntity();
        cargue.setFicha(ficha);
        cargue.setConsecutivoCargue(nextConsecutivo);
        cargue.setNombreArchivoOriginal(file.getOriginalFilename() != null ? file.getOriginalFilename() : "reporte.xlsx");
        cargue.setHashSha256(sha256);
        cargue.setFechaReporteSena(fechaReporte);
        cargue.setFechaCargue(LocalDateTime.now());
        cargue.setTotalFilasProcesadas(rawRows.size());
        cargue.setAprendicesAfectados(aprendicesGuardados.size());
        cargue.setJuiciosNuevosAprobados(juiciosNuevosAprobados);
        cargue.setJuiciosPendientes(juiciosPendientesTotal);
        cargue.setJuiciosNoAprobados(juiciosNoAprobadosTotal);
        cargue.setSubidoPor("Carlos Julio Cadena (Instructor)");
        cargue.setObservaciones("Cargue procesado exitosamente con deduplicación SENA. Total filas: " + rawRows.size());
        historialCargueRepository.save(cargue);

        Map<String, Object> result = new HashMap<>();
        result.put("mensaje", "Reporte SOFIA procesado exitosamente.");
        result.put("consecutivoCargue", nextConsecutivo);
        result.put("totalFilasExcel", rawRows.size());
        result.put("aprendicesUnicos", aprendicesGuardados.size());
        result.put("juiciosNuevosAprobados", juiciosNuevosAprobados);
        result.put("juiciosAprobadosTotal", juiciosAprobadosTotal);
        result.put("juiciosPendientesTotal", juiciosPendientesTotal);
        result.put("juiciosNoAprobadosTotal", juiciosNoAprobadosTotal);
        return result;
    }

    private LocalDateTime extractDate(Cell cell, DataFormatter formatter) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date d = cell.getDateCellValue();
            return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        String s = formatter.formatCellValue(cell).trim();
        if (s.isEmpty()) return null;
        try {
            // Intentar formatos comunes
            if (s.contains("/")) {
                String[] parts = s.split(" ")[0].split("/");
                int d = Integer.parseInt(parts[0]);
                int m = Integer.parseInt(parts[1]);
                int y = Integer.parseInt(parts[2]);
                return LocalDateTime.of(y, m, d, 10, 0);
            }
        } catch (Exception ignored) {}
        return LocalDateTime.now();
    }

    private LocalDate parseDate(String val) {
        if (val == null || val.trim().isEmpty()) return LocalDate.now();
        String s = val.trim();
        if (s.contains("/")) {
            String[] parts = s.split("/");
            return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
        }
        return LocalDate.now();
    }

    private String calculateSHA256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private static class RowData {
        String tipoDoc = "";
        String numDoc = "";
        String nombre = "";
        String apellidos = "";
        String estado = "";
        String competencia = "";
        String rap = "";
        String juicio = "POR EVALUAR";
        LocalDateTime fechaJuicio;
        String funcionario = "";
    }
}
