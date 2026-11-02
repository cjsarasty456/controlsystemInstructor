package com.sena.controlsystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_cargues")
public class HistorialCargueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaEntity ficha;

    @Column(name = "consecutivo_cargue", nullable = false)
    private Integer consecutivoCargue = 1;

    @Column(name = "nombre_archivo_original", nullable = false, length = 255)
    private String nombreArchivoOriginal;

    @Column(name = "hash_sha256", nullable = false, length = 64)
    private String hashSha256 = "";

    @Column(name = "fecha_reporte_sena")
    private LocalDate fechaReporteSena;

    @Column(name = "fecha_cargue")
    private LocalDateTime fechaCargue = LocalDateTime.now();

    @Column(name = "total_filas_procesadas", nullable = false)
    private Integer totalFilasProcesadas = 0;

    @Column(name = "aprendices_afectados", nullable = false)
    private Integer aprendicesAfectados = 0;

    @Column(name = "juicios_nuevos_aprobados")
    private Integer juiciosNuevosAprobados = 0;

    @Column(name = "juicios_pendientes")
    private Integer juiciosPendientes = 0;

    @Column(name = "juicios_no_aprobados")
    private Integer juiciosNoAprobados = 0;

    @Column(name = "subido_por", length = 150)
    private String subidoPor = "Carlos Julio Cadena";

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    public HistorialCargueEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FichaEntity getFicha() { return ficha; }
    public void setFicha(FichaEntity ficha) { this.ficha = ficha; }

    public Integer getConsecutivoCargue() { return consecutivoCargue; }
    public void setConsecutivoCargue(Integer consecutivoCargue) { this.consecutivoCargue = consecutivoCargue; }

    public String getNombreArchivoOriginal() { return nombreArchivoOriginal; }
    public void setNombreArchivoOriginal(String nombreArchivoOriginal) { this.nombreArchivoOriginal = nombreArchivoOriginal; }

    public String getHashSha256() { return hashSha256; }
    public void setHashSha256(String hashSha256) { this.hashSha256 = hashSha256; }

    public LocalDate getFechaReporteSena() { return fechaReporteSena; }
    public void setFechaReporteSena(LocalDate fechaReporteSena) { this.fechaReporteSena = fechaReporteSena; }

    public LocalDateTime getFechaCargue() { return fechaCargue; }
    public void setFechaCargue(LocalDateTime fechaCargue) { this.fechaCargue = fechaCargue; }

    public Integer getTotalFilasProcesadas() { return totalFilasProcesadas; }
    public void setTotalFilasProcesadas(Integer totalFilasProcesadas) { this.totalFilasProcesadas = totalFilasProcesadas; }

    public Integer getAprendicesAfectados() { return aprendicesAfectados; }
    public void setAprendicesAfectados(Integer aprendicesAfectados) { this.aprendicesAfectados = aprendicesAfectados; }

    public Integer getJuiciosNuevosAprobados() { return juiciosNuevosAprobados; }
    public void setJuiciosNuevosAprobados(Integer juiciosNuevosAprobados) { this.juiciosNuevosAprobados = juiciosNuevosAprobados; }

    public Integer getJuiciosPendientes() { return juiciosPendientes; }
    public void setJuiciosPendientes(Integer juiciosPendientes) { this.juiciosPendientes = juiciosPendientes; }

    public Integer getJuiciosNoAprobados() { return juiciosNoAprobados; }
    public void setJuiciosNoAprobados(Integer juiciosNoAprobados) { this.juiciosNoAprobados = juiciosNoAprobados; }

    public String getSubidoPor() { return subidoPor; }
    public void setSubidoPor(String subidoPor) { this.subidoPor = subidoPor; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
