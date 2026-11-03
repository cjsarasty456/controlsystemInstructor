package com.sena.controlsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sena.controlsystem.service.BackupService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin(origins = "*")
public class BackupController {

    private final BackupService backupService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    /**
     * Descarga la copia de seguridad completa en formato JSON
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportBackupJson() {
        try {
            Map<String, Object> data = backupService.exportDatabaseToJson();
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = String.format("backup_controlsystem_SENA_%s.json", timestamp);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error generando respaldo JSON: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Descarga la copia de seguridad nativa en formato SQL (pg_dump)
     */
    @GetMapping("/export/sql")
    public ResponseEntity<byte[]> exportBackupSql() {
        try {
            String sql = backupService.exportDatabaseToSql();
            byte[] bytes = sql.getBytes(StandardCharsets.UTF_8);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = String.format("backup_controlsystem_SENA_%s.sql", timestamp);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType("application/sql"))
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error generando respaldo SQL con pg_dump: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Importa y restaura una copia de seguridad subida por el usuario (.json o .sql)
     */
    @PostMapping("/import")
    public ResponseEntity<?> importBackup(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo de respaldo está vacío."));
            }

            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (filename.endsWith(".json")) {
                String content = new String(file.getBytes(), StandardCharsets.UTF_8);
                Map<String, Object> result = backupService.importDatabaseFromJson(content);
                return ResponseEntity.ok(result);
            } else if (filename.endsWith(".sql")) {
                // Escribir temporal y restaurar
                java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("restore_", ".sql");
                file.transferTo(tempFile);

                ProcessBuilder pb = new ProcessBuilder(
                        "psql",
                        "-h", "localhost",
                        "-U", "postgres",
                        "-d", "controlsystem_db",
                        "-f", tempFile.toString()
                );
                pb.environment().put("PGPASSWORD", "postgres");
                Process p = pb.start();
                int exit = p.waitFor();
                java.nio.file.Files.deleteIfExists(tempFile);

                if (exit != 0) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "psql retornó código de error: " + exit));
                }

                return ResponseEntity.ok(Map.of("mensaje", "Respaldo SQL nativo importado y restaurado en PostgreSQL exitosamente."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Formato no válido. Debe ser un archivo .json o .sql"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Fallo al restaurar copia de seguridad: " + e.getMessage()));
        }
    }

    /**
     * Lista los respaldos guardados en el repositorio del servidor
     */
    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> listServerBackups() {
        return ResponseEntity.ok(backupService.listServerBackups());
    }

    /**
     * Restaura un archivo existente directamente desde el servidor
     */
    @PostMapping("/restore-server")
    public ResponseEntity<?> restoreFromServer(@RequestBody Map<String, String> body) {
        try {
            String fileName = body.get("fileName");
            if (fileName == null || fileName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nombre de archivo no especificado."));
            }
            Map<String, Object> result = backupService.restoreServerBackup(fileName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error restaurando desde servidor: " + e.getMessage()));
        }
    }
}

