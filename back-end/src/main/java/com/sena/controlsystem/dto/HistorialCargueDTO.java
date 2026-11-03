package com.sena.controlsystem.dto;

import java.util.UUID;

public class HistorialCargueDTO {
    private UUID id;
    private Integer numeroCargue;
    private String filename;
    private String fechaReporte;
    private String fechaCargue;
    private Integer totalFilasExcel;
    private Integer totalAprendices;
    private Integer juiciosAprobados;
    private Integer juiciosPendientes;
    private Integer juiciosNoAprobados;
    private String subidoPor;
    private String hashSha256;

    public HistorialCargueDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Integer getNumeroCargue() { return numeroCargue; }
    public void setNumeroCargue(Integer numeroCargue) { this.numeroCargue = numeroCargue; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getFechaReporte() { return fechaReporte; }
    public void setFechaReporte(String fechaReporte) { this.fechaReporte = fechaReporte; }

    public String getFechaCargue() { return fechaCargue; }
    public void setFechaCargue(String fechaCargue) { this.fechaCargue = fechaCargue; }

    public Integer getTotalFilasExcel() { return totalFilasExcel; }
    public void setTotalFilasExcel(Integer totalFilasExcel) { this.totalFilasExcel = totalFilasExcel; }

    public Integer getTotalAprendices() { return totalAprendices; }
    public void setTotalAprendices(Integer totalAprendices) { this.totalAprendices = totalAprendices; }

    public Integer getJuiciosAprobados() { return juiciosAprobados; }
    public void setJuiciosAprobados(Integer juiciosAprobados) { this.juiciosAprobados = juiciosAprobados; }

    public Integer getJuiciosPendientes() { return juiciosPendientes; }
    public void setJuiciosPendientes(Integer juiciosPendientes) { this.juiciosPendientes = juiciosPendientes; }

    public Integer getJuiciosNoAprobados() { return juiciosNoAprobados; }
    public void setJuiciosNoAprobados(Integer juiciosNoAprobados) { this.juiciosNoAprobados = juiciosNoAprobados; }

    public String getSubidoPor() { return subidoPor; }
    public void setSubidoPor(String subidoPor) { this.subidoPor = subidoPor; }

    public String getHashSha256() { return hashSha256; }
    public void setHashSha256(String hashSha256) { this.hashSha256 = hashSha256; }
}
