package com.sena.controlsystem.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class FichaResponseDTO {
    private Long id;
    private String numero;
    private String programa;
    private String codigo;
    private String version;
    private String jornada;
    private String estado;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String regional;
    private String centro;
    private String reporteProyectoJson;
    private int totalAprendices;
    private int aprendicesEnFormacion;
    private int totalJuicios;
    private int juiciosAprobados;
    private int juiciosPendientes;
    private int juiciosNoAprobados;
    private List<AprendizDTO> aprendices = new ArrayList<>();
    private List<JuicioItemDTO> juicios = new ArrayList<>();
    private List<HistorialCargueDTO> reportes = new ArrayList<>();

    public FichaResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getPrograma() { return programa; }
    public void setPrograma(String programa) { this.programa = programa; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getJornada() { return jornada; }
    public void setJornada(String jornada) { this.jornada = jornada; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public String getRegional() { return regional; }
    public void setRegional(String regional) { this.regional = regional; }

    public String getCentro() { return centro; }
    public void setCentro(String centro) { this.centro = centro; }

    public String getReporteProyectoJson() { return reporteProyectoJson; }
    public void setReporteProyectoJson(String reporteProyectoJson) { this.reporteProyectoJson = reporteProyectoJson; }

    public int getTotalAprendices() { return totalAprendices; }
    public void setTotalAprendices(int totalAprendices) { this.totalAprendices = totalAprendices; }

    public int getAprendicesEnFormacion() { return aprendicesEnFormacion; }
    public void setAprendicesEnFormacion(int aprendicesEnFormacion) { this.aprendicesEnFormacion = aprendicesEnFormacion; }

    public int getTotalJuicios() { return totalJuicios; }
    public void setTotalJuicios(int totalJuicios) { this.totalJuicios = totalJuicios; }

    public int getJuiciosAprobados() { return juiciosAprobados; }
    public void setJuiciosAprobados(int juiciosAprobados) { this.juiciosAprobados = juiciosAprobados; }

    public int getJuiciosPendientes() { return juiciosPendientes; }
    public void setJuiciosPendientes(int juiciosPendientes) { this.juiciosPendientes = juiciosPendientes; }

    public int getJuiciosNoAprobados() { return juiciosNoAprobados; }
    public void setJuiciosNoAprobados(int juiciosNoAprobados) { this.juiciosNoAprobados = juiciosNoAprobados; }

    public List<AprendizDTO> getAprendices() { return aprendices; }
    public void setAprendices(List<AprendizDTO> aprendices) { this.aprendices = aprendices; }

    public List<JuicioItemDTO> getJuicios() { return juicios; }
    public void setJuicios(List<JuicioItemDTO> juicios) { this.juicios = juicios; }

    public List<HistorialCargueDTO> getReportes() { return reportes; }
    public void setReportes(List<HistorialCargueDTO> reportes) { this.reportes = reportes; }
}
