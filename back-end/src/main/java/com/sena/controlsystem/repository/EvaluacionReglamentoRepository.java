package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.EvaluacionReglamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluacionReglamentoRepository extends JpaRepository<EvaluacionReglamentoEntity, Long> {
    List<EvaluacionReglamentoEntity> findByFichaIdOrderByFechaEvaluacionDesc(Long fichaId);
    List<EvaluacionReglamentoEntity> findByAprendizIdOrderByFechaEvaluacionDesc(Long aprendizId);
}

