package com.sena.controlsystem.dto;

import java.util.UUID;

public class JuicioItemDTO {
    private UUID id;
    private String tipoDoc;
    private String numDoc;
    private String nombre;
    private String apellidos;
    private String estadoApr;
    private String competencia;
    private String rap;
    private String juicio;
    private String fechaHoraJuicio;
    private String funcionario;

    public JuicioItemDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTipoDoc() { return tipoDoc; }
    public void setTipoDoc(String tipoDoc) { this.tipoDoc = tipoDoc; }

    public String getNumDoc() { return numDoc; }
    public void setNumDoc(String numDoc) { this.numDoc = numDoc; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getEstadoApr() { return estadoApr; }
    public void setEstadoApr(String estadoApr) { this.estadoApr = estadoApr; }

    public String getCompetencia() { return competencia; }
    public void setCompetencia(String competencia) { this.competencia = competencia; }

    public String getRap() { return rap; }
    public void setRap(String rap) { this.rap = rap; }

    public String getJuicio() { return juicio; }
    public void setJuicio(String juicio) { this.juicio = juicio; }

    public String getFechaHoraJuicio() { return fechaHoraJuicio; }
    public void setFechaHoraJuicio(String fechaHoraJuicio) { this.fechaHoraJuicio = fechaHoraJuicio; }

    public String getFuncionario() { return funcionario; }
    public void setFuncionario(String funcionario) { this.funcionario = funcionario; }
}
