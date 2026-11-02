package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.JuicioDetalleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JuicioDetalleRepository extends JpaRepository<JuicioDetalleEntity, Long> {
    List<JuicioDetalleEntity> findByFichaId(Long fichaId);
    List<JuicioDetalleEntity> findByAprendizId(Long fichaId);
    Optional<JuicioDetalleEntity> findByAprendizIdAndResultadoAprendizaje(Long aprendizId, String resultadoAprendizaje);

    @Query("SELECT j FROM JuicioDetalleEntity j JOIN FETCH j.aprendiz a WHERE j.ficha.id = :fichaId")
    List<JuicioDetalleEntity> findAllWithAprendizByFichaId(@Param("fichaId") Long fichaId);

    long countByFichaIdAndJuicioEvaluacion(Long fichaId, String juicioEvaluacion);
}
