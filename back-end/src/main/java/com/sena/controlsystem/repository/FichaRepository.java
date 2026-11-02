package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.FichaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FichaRepository extends JpaRepository<FichaEntity, Long> {
    Optional<FichaEntity> findByNumeroFicha(String numeroFicha);
    boolean existsByNumeroFicha(String numeroFicha);
}
