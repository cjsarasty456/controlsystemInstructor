package com.sena.controlsystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "servicio", "Sistema de Control de Instructores SENA CIES Huila",
                "backend", "Spring Boot 3.2.3 (Java 17)",
                "database", "PostgreSQL 18 (controlsystem_db)",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}

