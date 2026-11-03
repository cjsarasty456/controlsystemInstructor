package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.JuicioDetalleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JuicioDetalleRepository extends JpaRepository<JuicioDetalleEntity, UUID> {
    List<JuicioDetalleEntity> findByFichaId(UUID fichaId);
    List<JuicioDetalleEntity> findByAprendizId(UUID aprendizId);
    Optional<JuicioDetalleEntity> findByAprendizIdAndResultadoAprendizaje(UUID aprendizId, String resultadoAprendizaje);

    @Query("SELECT j FROM JuicioDetalleEntity j JOIN FETCH j.aprendiz a WHERE j.ficha.id = :fichaId")
    List<JuicioDetalleEntity> findAllWithAprendizByFichaId(@Param("fichaId") UUID fichaId);

    long countByFichaIdAndJuicioEvaluacion(UUID fichaId, String juicioEvaluacion);
}
