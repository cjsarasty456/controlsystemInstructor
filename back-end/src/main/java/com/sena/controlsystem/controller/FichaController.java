package com.sena.controlsystem.controller;

import com.sena.controlsystem.dto.FichaResponseDTO;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.repository.FichaRepository;
import com.sena.controlsystem.service.FichaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fichas")
@CrossOrigin(origins = "*")
public class FichaController {

    private final FichaService fichaService;
    private final FichaRepository fichaRepository;

    public FichaController(FichaService fichaService, FichaRepository fichaRepository) {
        this.fichaService = fichaService;
        this.fichaRepository = fichaRepository;
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
    public ResponseEntity<FichaEntity> createFicha(@RequestBody FichaEntity ficha) {
        ficha.setCreadoEn(LocalDateTime.now());
        ficha.setActualizadoEn(LocalDateTime.now());
        FichaEntity saved = fichaRepository.save(ficha);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{fichaId}/proyecto")
    public ResponseEntity<?> updateProjectReport(
            @PathVariable Long fichaId,
            @RequestBody Map<String, Object> body) {
        Object projectJson = body.get("reporteProyecto");
        String jsonStr = projectJson != null ? projectJson.toString() : "{}";
        FichaEntity updated = fichaService.saveOrUpdateProjectReport(fichaId, jsonStr);
        return ResponseEntity.ok(Map.of("mensaje", "Reporte de proyecto formativo actualizado.", "fichaId", updated.getId()));
    }
}
