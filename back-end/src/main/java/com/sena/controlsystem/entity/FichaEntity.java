package com.sena.controlsystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fichas")
public class FichaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "numero_ficha", nullable = false, unique = true, length = 20)
    private String numeroFicha;

    @Column(name = "programa_nombre", nullable = false, length = 255)
    private String programaNombre;

    @Column(name = "programa_codigo", length = 50)
    private String programaCodigo = "228118";

    @Column(name = "programa_version", length = 20)
    private String programaVersion = "1";

    @Column(name = "jornada", nullable = false, length = 50)
    private String jornada = "PRESENCIAL";

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "sede_centro", length = 255)
    private String sedeCentro = "9527 - CENTRO DE LA INDUSTRIA, LA EMPRESA Y LOS SERVICIOS";

    @Column(name = "regional", length = 150)
    private String regional = "41 - REGIONAL HUILA";

    @Column(name = "estado", length = 30)
    private String estado = "EN EJECUCION";

    @Column(name = "reporte_proyecto_json", columnDefinition = "TEXT")
    private String reporteProyectoJson;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now();

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    public FichaEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNumeroFicha() { return numeroFicha; }
    public void setNumeroFicha(String numeroFicha) { this.numeroFicha = numeroFicha; }

    public String getProgramaNombre() { return programaNombre; }
    public void setProgramaNombre(String programaNombre) { this.programaNombre = programaNombre; }

    public String getProgramaCodigo() { return programaCodigo; }
    public void setProgramaCodigo(String programaCodigo) { this.programaCodigo = programaCodigo; }

    public String getProgramaVersion() { return programaVersion; }
    public void setProgramaVersion(String programaVersion) { this.programaVersion = programaVersion; }

    public String getJornada() { return jornada; }
    public void setJornada(String jornada) { this.jornada = jornada; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public String getSedeCentro() { return sedeCentro; }
    public void setSedeCentro(String sedeCentro) { this.sedeCentro = sedeCentro; }

    public String getRegional() { return regional; }
    public void setRegional(String regional) { this.regional = regional; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getReporteProyectoJson() { return reporteProyectoJson; }
    public void setReporteProyectoJson(String reporteProyectoJson) { this.reporteProyectoJson = reporteProyectoJson; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }

    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
    public void setActualizadoEn(LocalDateTime actualizadoEn) { this.actualizadoEn = actualizadoEn; }
}
