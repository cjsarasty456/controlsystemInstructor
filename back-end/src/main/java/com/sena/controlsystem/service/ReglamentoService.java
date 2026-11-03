package com.sena.controlsystem.service;

import com.sena.controlsystem.dto.EvaluacionDTO;
import com.sena.controlsystem.entity.AprendizEntity;
import com.sena.controlsystem.entity.EvaluacionReglamentoEntity;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.repository.AprendizRepository;
import com.sena.controlsystem.repository.EvaluacionReglamentoRepository;
import com.sena.controlsystem.repository.FichaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReglamentoService {

    private final EvaluacionReglamentoRepository evaluacionRepository;
    private final FichaRepository fichaRepository;
    private final AprendizRepository aprendizRepository;

    public ReglamentoService(
            EvaluacionReglamentoRepository evaluacionRepository,
            FichaRepository fichaRepository,
            AprendizRepository aprendizRepository) {
        this.evaluacionRepository = evaluacionRepository;
        this.fichaRepository = fichaRepository;
        this.aprendizRepository = aprendizRepository;
    }

    @Transactional(readOnly = true)
    public List<EvaluacionDTO> getEvaluacionesPorFicha(Long fichaId) {
        return evaluacionRepository.findByFichaIdOrderByFechaEvaluacionDesc(fichaId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EvaluacionDTO registrarEvaluacion(EvaluacionDTO request) {
        FichaEntity ficha = fichaRepository.findById(request.getFichaId())
                .orElseThrow(() -> new IllegalArgumentException("Ficha no encontrada: " + request.getFichaId()));

        AprendizEntity aprendiz = aprendizRepository.findById(request.getAprendizId())
                .orElseThrow(() -> new IllegalArgumentException("Aprendiz no encontrado: " + request.getAprendizId()));

        EvaluacionReglamentoEntity entity = new EvaluacionReglamentoEntity();
        entity.setFicha(ficha);
        entity.setAprendiz(aprendiz);
        entity.setMotivo(request.getMotivo() != null ? request.getMotivo() : "ACADEMICO");
        entity.setGravedad(request.getGravedad() != null ? request.getGravedad() : "GRAVE");
        entity.setClasificacionFalta(request.getClasificacionFalta());
        entity.setMedidaRecomendada(request.getMedidaRecomendada());
        entity.setArticulosInvocados(request.getArticulosInvocados());
        entity.setRequiereComite(request.getRequiereComite() != null ? request.getRequiereComite() : true);
        entity.setTextoCitacion(request.getTextoCitacion());
        entity.setFechaEvaluacion(request.getFechaEvaluacion() != null ? request.getFechaEvaluacion() : LocalDate.now());
        entity.setInstructorResponsable(request.getInstructorResponsable() != null ? request.getInstructorResponsable() : "Carlos Julio Cadena");
        entity.setCreadoEn(LocalDateTime.now());

        EvaluacionReglamentoEntity saved = evaluacionRepository.save(entity);
        return mapToDTO(saved);
    }

    private EvaluacionDTO mapToDTO(EvaluacionReglamentoEntity e) {
        EvaluacionDTO dto = new EvaluacionDTO();
        dto.setId(e.getId());
        dto.setFichaId(e.getFicha().getId());
        dto.setAprendizId(e.getAprendiz().getId());
        dto.setAprendizNombre(e.getAprendiz().getNombreCompleto());
        dto.setAprendizDocumento(e.getAprendiz().getNumeroDocumento());
        dto.setMotivo(e.getMotivo());
        dto.setGravedad(e.getGravedad());
        dto.setClasificacionFalta(e.getClasificacionFalta());
        dto.setMedidaRecomendada(e.getMedidaRecomendada());
        dto.setArticulosInvocados(e.getArticulosInvocados());
        dto.setRequiereComite(e.getRequiereComite());
        dto.setTextoCitacion(e.getTextoCitacion());
        dto.setFechaEvaluacion(e.getFechaEvaluacion());
        dto.setInstructorResponsable(e.getInstructorResponsable());
        return dto;
    }
}

