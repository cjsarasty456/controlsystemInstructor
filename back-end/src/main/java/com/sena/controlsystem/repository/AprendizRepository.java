package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.AprendizEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AprendizRepository extends JpaRepository<AprendizEntity, UUID> {
    List<AprendizEntity> findByFichaId(UUID fichaId);
    Optional<AprendizEntity> findByNumeroDocumentoAndFichaId(String numeroDocumento, UUID fichaId);
    long countByFichaId(UUID fichaId);
    long countByFichaIdAndEstadoSenaContainingIgnoreCase(UUID fichaId, String estado);
}
