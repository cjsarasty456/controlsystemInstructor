package com.sena.controlsystem.controller;

import com.sena.controlsystem.dto.FichaCreateDTO;
import com.sena.controlsystem.dto.FichaResponseDTO;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.service.FichaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/fichas")
public class FichaController {

    private final FichaService fichaService;

    public FichaController(FichaService fichaService) {
        this.fichaService = fichaService;
    }

    @GetMapping
    public ResponseEntity<List<FichaResponseDTO>> getFichas() {
        return ResponseEntity.ok(fichaService.getAllFichas());
    }

    @GetMapping("/{idOrNumero}")
    public ResponseEntity<FichaResponseDTO> getFicha(@PathVariable String idOrNumero) {
        return fichaService.getFichaByNumeroOrId(idOrNumero)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FichaResponseDTO> createFicha(@RequestBody FichaCreateDTO fichaDTO) {
        FichaResponseDTO saved = fichaService.createFicha(fichaDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{fichaId}/proyecto")
    public ResponseEntity<?> updateProjectReport(
            @PathVariable UUID fichaId,
            @RequestBody Map<String, Object> body) {
        Object projectJson = body.get("reporteProyecto");
        String jsonStr = projectJson != null ? projectJson.toString() : "{}";
        FichaEntity updated = fichaService.saveOrUpdateProjectReport(fichaId, jsonStr);
        return ResponseEntity.ok(Map.of("mensaje", "Reporte de proyecto formativo actualizado.", "fichaId", updated.getId()));
    }
}
