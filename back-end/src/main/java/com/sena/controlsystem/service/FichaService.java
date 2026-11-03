package com.sena.controlsystem.service;

import com.sena.controlsystem.dto.AprendizDTO;
import com.sena.controlsystem.dto.FichaResponseDTO;
import com.sena.controlsystem.dto.HistorialCargueDTO;
import com.sena.controlsystem.dto.JuicioItemDTO;
import com.sena.controlsystem.entity.AprendizEntity;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.entity.HistorialCargueEntity;
import com.sena.controlsystem.entity.JuicioDetalleEntity;
import com.sena.controlsystem.repository.AprendizRepository;
import com.sena.controlsystem.repository.FichaRepository;
import com.sena.controlsystem.repository.HistorialCargueRepository;
import com.sena.controlsystem.repository.JuicioDetalleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FichaService {

    private final FichaRepository fichaRepository;
    private final AprendizRepository aprendizRepository;
    private final JuicioDetalleRepository juicioDetalleRepository;
    private final HistorialCargueRepository historialCargueRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public FichaService(
            FichaRepository fichaRepository,
            AprendizRepository aprendizRepository,
            JuicioDetalleRepository juicioDetalleRepository,
            HistorialCargueRepository historialCargueRepository) {
        this.fichaRepository = fichaRepository;
        this.aprendizRepository = aprendizRepository;
        this.juicioDetalleRepository = juicioDetalleRepository;
        this.historialCargueRepository = historialCargueRepository;
    }

    @Transactional(readOnly = true)
    public List<FichaResponseDTO> getAllFichas() {
        List<FichaEntity> fichas = fichaRepository.findAll();
        return fichas.stream().map(this::mapToSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<FichaResponseDTO> getFichaByNumeroOrId(String identifier) {
        Optional<FichaEntity> fichaOpt = Optional.empty();
        try {
            UUID id = UUID.fromString(identifier);
            fichaOpt = fichaRepository.findById(id);
        } catch (IllegalArgumentException ignored) {
            // No es UUID válido, se busca por número de ficha
        }

        if (fichaOpt.isEmpty()) {
            fichaOpt = fichaRepository.findByNumeroFicha(identifier);
        }

        return fichaOpt.map(this::mapToDetailDTO);
    }

    @Transactional
    public FichaEntity saveOrUpdateProjectReport(UUID fichaId, String projectJson) {
        FichaEntity ficha = fichaRepository.findById(fichaId)
                .orElseThrow(() -> new IllegalArgumentException("Ficha no encontrada con id: " + fichaId));
        ficha.setReporteProyectoJson(projectJson);
        return fichaRepository.save(ficha);
    }

    private FichaResponseDTO mapToSummaryDTO(FichaEntity f) {
        FichaResponseDTO dto = new FichaResponseDTO();
        dto.setId(f.getId());
        dto.setNumero(f.getNumeroFicha());
        dto.setPrograma(f.getProgramaNombre());
        dto.setCodigo(f.getProgramaCodigo());
        dto.setVersion(f.getProgramaVersion());
        dto.setJornada(f.getJornada());
        dto.setEstado(f.getEstado());
        dto.setFechaInicio(f.getFechaInicio());
        dto.setFechaFin(f.getFechaFin());
        dto.setRegional(f.getRegional());
        dto.setCentro(f.getSedeCentro());
        dto.setReporteProyectoJson(f.getReporteProyectoJson());

        int totalApr = (int) aprendizRepository.countByFichaId(f.getId());
        int enForm = (int) aprendizRepository.countByFichaIdAndEstadoSenaContainingIgnoreCase(f.getId(), "FORMACION");
        dto.setTotalAprendices(totalApr);
        dto.setAprendicesEnFormacion(enForm > 0 ? enForm : totalApr);

        int aprobados = (int) juicioDetalleRepository.countByFichaIdAndJuicioEvaluacion(f.getId(), "APROBADO");
        int pendientes = (int) juicioDetalleRepository.countByFichaIdAndJuicioEvaluacion(f.getId(), "POR EVALUAR");
        int noAprobados = (int) juicioDetalleRepository.countByFichaIdAndJuicioEvaluacion(f.getId(), "NO APROBADO");

        dto.setJuiciosAprobados(aprobados);
        dto.setJuiciosPendientes(pendientes);
        dto.setJuiciosNoAprobados(noAprobados);
        dto.setTotalJuicios(aprobados + pendientes + noAprobados);

        return dto;
    }

    private FichaResponseDTO mapToDetailDTO(FichaEntity f) {
        FichaResponseDTO dto = mapToSummaryDTO(f);

        // Cargar aprendices únicos
        List<AprendizEntity> aprendicesEntities = aprendizRepository.findByFichaId(f.getId());
        List<JuicioDetalleEntity> juiciosEntities = juicioDetalleRepository.findAllWithAprendizByFichaId(f.getId());

        // Agrupar juicios por aprendiz (UUID)
        Map<UUID, List<JuicioDetalleEntity>> juiciosPorAprendiz = juiciosEntities.stream()
                .collect(Collectors.groupingBy(j -> j.getAprendiz().getId()));

        List<AprendizDTO> aprendicesDTOList = new ArrayList<>();
        for (AprendizEntity apr : aprendicesEntities) {
            AprendizDTO aprDTO = new AprendizDTO();
            aprDTO.setId(apr.getId());
            aprDTO.setTipoDoc(apr.getTipoDocumento());
            aprDTO.setNumDoc(apr.getNumeroDocumento());
            aprDTO.setNombre(apr.getNombres());
            aprDTO.setApellidos(apr.getApellidos());
            aprDTO.setNombreCompleto(apr.getNombreCompleto());
            aprDTO.setEstado(apr.getEstadoSena());

            List<JuicioDetalleEntity> learnerJuicios = juiciosPorAprendiz.getOrDefault(apr.getId(), Collections.emptyList());
            int aprAprobados = 0;
            int aprPendientes = 0;
            int aprNoAprobados = 0;

            List<JuicioItemDTO> rapsDTOList = new ArrayList<>();
            for (JuicioDetalleEntity j : learnerJuicios) {
                JuicioItemDTO item = new JuicioItemDTO();
                item.setId(j.getId());
                item.setTipoDoc(apr.getTipoDocumento());
                item.setNumDoc(apr.getNumeroDocumento());
                item.setNombre(apr.getNombres());
                item.setApellidos(apr.getApellidos());
                item.setEstadoApr(apr.getEstadoSena());
                item.setCompetencia(j.getCompetenciaDenominacion());
                item.setRap(j.getResultadoAprendizaje());
                item.setJuicio(j.getJuicioEvaluacion());
                item.setFechaHoraJuicio(j.getFechaHoraJuicio() != null ? j.getFechaHoraJuicio().format(DATE_TIME_FORMATTER) : "");
                item.setFuncionario(j.getFuncionarioRegistro());
                rapsDTOList.add(item);

                if ("APROBADO".equalsIgnoreCase(j.getJuicioEvaluacion())) aprAprobados++;
                else if ("NO APROBADO".equalsIgnoreCase(j.getJuicioEvaluacion())) aprNoAprobados++;
                else aprPendientes++;
            }

            aprDTO.setTotalRaps(learnerJuicios.size());
            aprDTO.setAprobados(aprAprobados);
            aprDTO.setPendientes(aprPendientes);
            aprDTO.setNoAprobados(aprNoAprobados);
            aprDTO.setPctAprobado(aprDTO.getTotalRaps() > 0 ? (double) Math.round(((double) aprAprobados / aprDTO.getTotalRaps()) * 1000) / 10 : 0.0);
            aprDTO.setRaps(rapsDTOList);

            aprendicesDTOList.add(aprDTO);
        }
        dto.setAprendices(aprendicesDTOList);

        // Mapear juicios consolidados para la tabla
        List<JuicioItemDTO> todosJuicios = juiciosEntities.stream().map(j -> {
            JuicioItemDTO item = new JuicioItemDTO();
            item.setId(j.getId());
            item.setTipoDoc(j.getAprendiz().getTipoDocumento());
            item.setNumDoc(j.getAprendiz().getNumeroDocumento());
            item.setNombre(j.getAprendiz().getNombres());
            item.setApellidos(j.getAprendiz().getApellidos());
            item.setEstadoApr(j.getAprendiz().getEstadoSena());
            item.setCompetencia(j.getCompetenciaDenominacion());
            item.setRap(j.getResultadoAprendizaje());
            item.setJuicio(j.getJuicioEvaluacion());
            item.setFechaHoraJuicio(j.getFechaHoraJuicio() != null ? j.getFechaHoraJuicio().format(DATE_TIME_FORMATTER) : "");
            item.setFuncionario(j.getFuncionarioRegistro());
            return item;
        }).collect(Collectors.toList());
        dto.setJuicios(todosJuicios);

        // Mapear historial de cargues
        List<HistorialCargueEntity> cargues = historialCargueRepository.findByFichaIdOrderByConsecutivoCargueDesc(f.getId());
        List<HistorialCargueDTO> carguesDTOList = cargues.stream().map(c -> {
            HistorialCargueDTO cDTO = new HistorialCargueDTO();
            cDTO.setId(c.getId());
            cDTO.setNumeroCargue(c.getConsecutivoCargue());
            cDTO.setFilename(c.getNombreArchivoOriginal());
            cDTO.setFechaReporte(c.getFechaReporteSena() != null ? c.getFechaReporteSena().format(DATE_FORMATTER) : "");
            cDTO.setFechaCargue(c.getFechaCargue() != null ? c.getFechaCargue().format(DATE_TIME_FORMATTER) : "");
            cDTO.setTotalFilasExcel(c.getTotalFilasProcesadas());
            cDTO.setTotalAprendices(c.getAprendicesAfectados());
            cDTO.setJuiciosAprobados(c.getJuiciosNuevosAprobados());
            cDTO.setJuiciosPendientes(c.getJuiciosPendientes());
            cDTO.setJuiciosNoAprobados(c.getJuiciosNoAprobados());
            cDTO.setSubidoPor(c.getSubidoPor());
            cDTO.setHashSha256(c.getHashSha256());
            return cDTO;
        }).collect(Collectors.toList());
        dto.setReportes(carguesDTOList);

        return dto;
    }
}
