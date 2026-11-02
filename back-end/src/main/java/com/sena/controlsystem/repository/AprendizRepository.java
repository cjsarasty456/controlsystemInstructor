package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.AprendizEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AprendizRepository extends JpaRepository<AprendizEntity, Long> {
    List<AprendizEntity> findByFichaId(Long fichaId);
    Optional<AprendizEntity> findByNumeroDocumentoAndFichaId(String numeroDocumento, Long fichaId);
    long countByFichaId(Long fichaId);
    long countByFichaIdAndEstadoSenaContainingIgnoreCase(Long fichaId, String estado);
}
