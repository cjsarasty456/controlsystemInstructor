package com.sena.controlsystem.service;

import com.sena.controlsystem.dto.FichaCreateDTO;
import com.sena.controlsystem.dto.FichaResponseDTO;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.repository.AprendizRepository;
import com.sena.controlsystem.repository.FichaRepository;
import com.sena.controlsystem.repository.HistorialCargueRepository;
import com.sena.controlsystem.repository.JuicioDetalleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FichaServiceTest {

    @Mock
    private FichaRepository fichaRepository;

    @Mock
    private AprendizRepository aprendizRepository;

    @Mock
    private JuicioDetalleRepository juicioDetalleRepository;

    @Mock
    private HistorialCargueRepository historialCargueRepository;

    @InjectMocks
    private FichaService fichaService;

    private FichaEntity testFicha;

    @BeforeEach
    void setUp() {
        testFicha = new FichaEntity();
        testFicha.setId(UUID.randomUUID());
        testFicha.setNumeroFicha("3145556");
        testFicha.setProgramaNombre("ANALISIS Y DESARROLLO DE SOFTWARE");
        testFicha.setJornada("PRESENCIAL");
        testFicha.setFechaInicio(LocalDate.now());
        testFicha.setEstado("EN EJECUCION");
    }

    @Test
    @DisplayName("Debe listar todas las fichas mapeadas a DTO")
    void testGetAllFichas() {
        // Arrange
        when(fichaRepository.findAll()).thenReturn(List.of(testFicha));

        // Act
        List<FichaResponseDTO> result = fichaService.getAllFichas();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("3145556", result.get(0).getNumero());
        verify(fichaRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Debe crear una ficha válidamente desacoplada de la entidad")
    void testCreateFicha() {
        // Arrange
        FichaCreateDTO createDTO = new FichaCreateDTO();
        createDTO.setNumeroFicha("3145556");
        createDTO.setProgramaNombre("ANALISIS Y DESARROLLO DE SOFTWARE");
        createDTO.setJornada("PRESENCIAL");
        createDTO.setFechaInicio(LocalDate.now());

        when(fichaRepository.save(any(FichaEntity.class))).thenReturn(testFicha);

        // Act
        FichaResponseDTO result = fichaService.createFicha(createDTO);

        // Assert
        assertNotNull(result);
        assertEquals("3145556", result.getNumero());
        assertEquals("EN EJECUCION", result.getEstado());
        verify(fichaRepository, times(1)).save(any(FichaEntity.class));
    }

    @Test
    @DisplayName("Debe buscar ficha por número exitosamente")
    void testGetFichaByNumeroOrId() {
        // Arrange
        when(fichaRepository.findByNumeroFicha("3145556")).thenReturn(Optional.of(testFicha));
        when(aprendizRepository.findByFichaIdOrderByApellidosAscNombresAsc(testFicha.getId()))
                .thenReturn(Collections.emptyList());
        when(juicioDetalleRepository.findByFichaId(testFicha.getId()))
                .thenReturn(Collections.emptyList());
        when(historialCargueRepository.findByFichaIdOrderByConsecutivoCargueDesc(testFicha.getId()))
                .thenReturn(Collections.emptyList());

        // Act
        Optional<FichaResponseDTO> result = fichaService.getFichaByNumeroOrId("3145556");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("3145556", result.get().getNumero());
    }
}
