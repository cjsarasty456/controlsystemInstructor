package com.sena.controlsystem.dto;

import java.util.ArrayList;
import java.util.List;

public class AprendizDTO {
    private Long id;
    private String tipoDoc;
    private String numDoc;
    private String nombre;
    private String apellidos;
    private String nombreCompleto;
    private String estado;
    private int totalRaps;
    private int aprobados;
    private int pendientes;
    private int noAprobados;
    private double pctAprobado;
    private List<JuicioItemDTO> raps = new ArrayList<>();

    public AprendizDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipoDoc() { return tipoDoc; }
    public void setTipoDoc(String tipoDoc) { this.tipoDoc = tipoDoc; }

    public String getNumDoc() { return numDoc; }
    public void setNumDoc(String numDoc) { this.numDoc = numDoc; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public int getTotalRaps() { return totalRaps; }
    public void setTotalRaps(int totalRaps) { this.totalRaps = totalRaps; }

    public int getAprobados() { return aprobados; }
    public void setAprobados(int aprobados) { this.aprobados = aprobados; }

    public int getPendientes() { return pendientes; }
    public void setPendientes(int pendientes) { this.pendientes = pendientes; }

    public int getNoAprobados() { return noAprobados; }
    public void setNoAprobados(int noAprobados) { this.noAprobados = noAprobados; }

    public double getPctAprobado() { return pctAprobado; }
    public void setPctAprobado(double pctAprobado) { this.pctAprobado = pctAprobado; }

    public List<JuicioItemDTO> getRaps() { return raps; }
    public void setRaps(List<JuicioItemDTO> raps) { this.raps = raps; }
}

