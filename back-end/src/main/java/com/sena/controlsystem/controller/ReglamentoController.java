package com.sena.controlsystem.controller;

import com.sena.controlsystem.dto.EvaluacionDTO;
import com.sena.controlsystem.service.ReglamentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ReglamentoController {

    private final ReglamentoService reglamentoService;

    public ReglamentoController(ReglamentoService reglamentoService) {
        this.reglamentoService = reglamentoService;
    }

    @GetMapping("/fichas/{fichaId}/evaluaciones")
    public ResponseEntity<List<EvaluacionDTO>> getEvaluacionesPorFicha(@PathVariable Long fichaId) {
        return ResponseEntity.ok(reglamentoService.getEvaluacionesPorFicha(fichaId));
    }

    @PostMapping("/reglamento/evaluar")
    public ResponseEntity<EvaluacionDTO> registrarEvaluacion(@RequestBody EvaluacionDTO request) {
        return ResponseEntity.ok(reglamentoService.registrarEvaluacion(request));
    }
}
