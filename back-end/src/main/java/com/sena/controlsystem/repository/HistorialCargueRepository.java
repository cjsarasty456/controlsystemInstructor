package com.sena.controlsystem.repository;

import com.sena.controlsystem.entity.HistorialCargueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialCargueRepository extends JpaRepository<HistorialCargueEntity, Long> {
    List<HistorialCargueEntity> findByFichaIdOrderByConsecutivoCargueDesc(Long fichaId);
    Integer countByFichaId(Long fichaId);
}
