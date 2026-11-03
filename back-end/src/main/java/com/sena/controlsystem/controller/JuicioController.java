package com.sena.controlsystem.controller;

import com.sena.controlsystem.service.JuicioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/fichas/{fichaId}/juicios")
@CrossOrigin(origins = "*")
public class JuicioController {

    private final JuicioService juicioService;

    public JuicioController(JuicioService juicioService) {
        this.juicioService = juicioService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadSofiaExcel(
            @PathVariable Long fichaId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo Excel está vacío."));
            }

            Map<String, Object> result = juicioService.procesarArchivoSofiaExcel(fichaId, file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error procesando archivo de juicios SOFIA: " + e.getMessage()));
        }
    }
}

