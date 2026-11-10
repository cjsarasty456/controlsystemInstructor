package com.sena.controlsystem.dto;

import java.time.LocalDate;

public class FichaCreateDTO {
    private String numeroFicha;
    private String programaNombre;
    private String programaCodigo;
    private String programaVersion;
    private String jornada;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String sedeCentro;
    private String regional;

    public FichaCreateDTO() {
    }

    public String getNumeroFicha() {
        return numeroFicha;
    }

    public void setNumeroFicha(String numeroFicha) {
        this.numeroFicha = numeroFicha;
    }

    public String getProgramaNombre() {
        return programaNombre;
    }

    public void setProgramaNombre(String programaNombre) {
        this.programaNombre = programaNombre;
    }

    public String getProgramaCodigo() {
        return programaCodigo;
    }

    public void setProgramaCodigo(String programaCodigo) {
        this.programaCodigo = programaCodigo;
    }

    public String getProgramaVersion() {
        return programaVersion;
    }

    public void setProgramaVersion(String programaVersion) {
        this.programaVersion = programaVersion;
    }

    public String getJornada() {
        return jornada;
    }

    public void setJornada(String jornada) {
        this.jornada = jornada;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getSedeCentro() {
        return sedeCentro;
    }

    public void setSedeCentro(String sedeCentro) {
        this.sedeCentro = sedeCentro;
    }

    public String getRegional() {
        return regional;
    }

    public void setRegional(String regional) {
        this.regional = regional;
    }
}
