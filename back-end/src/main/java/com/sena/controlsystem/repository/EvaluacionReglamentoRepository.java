package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.EvaluacionReglamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvaluacionReglamentoRepository extends JpaRepository<EvaluacionReglamentoEntity, UUID> {
    List<EvaluacionReglamentoEntity> findByFichaIdOrderByFechaEvaluacionDesc(UUID fichaId);
    List<EvaluacionReglamentoEntity> findByAprendizIdOrderByFechaEvaluacionDesc(UUID aprendizId);
}
