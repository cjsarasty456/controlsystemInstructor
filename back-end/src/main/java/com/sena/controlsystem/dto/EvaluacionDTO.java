package com.sena.controlsystem.dto;

import java.time.LocalDate;
import java.util.UUID;

public class EvaluacionDTO {
    private UUID id;
    private UUID fichaId;
    private UUID aprendizId;
    private String aprendizNombre;
    private String aprendizDocumento;
    private String motivo;
    private String gravedad;
    private String clasificacionFalta;
    private String medidaRecomendada;
    private String articulosInvocados;
    private Boolean requiereComite;
    private String textoCitacion;
    private LocalDate fechaEvaluacion;
    private String instructorResponsable;

    public EvaluacionDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getFichaId() { return fichaId; }
    public void setFichaId(UUID fichaId) { this.fichaId = fichaId; }

    public UUID getAprendizId() { return aprendizId; }
    public void setAprendizId(UUID aprendizId) { this.aprendizId = aprendizId; }

    public String getAprendizNombre() { return aprendizNombre; }
    public void setAprendizNombre(String aprendizNombre) { this.aprendizNombre = aprendizNombre; }

    public String getAprendizDocumento() { return aprendizDocumento; }
    public void setAprendizDocumento(String aprendizDocumento) { this.aprendizDocumento = aprendizDocumento; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public String getGravedad() { return gravedad; }
    public void setGravedad(String gravedad) { this.gravedad = gravedad; }

    public String getClasificacionFalta() { return clasificacionFalta; }
    public void setClasificacionFalta(String clasificacionFalta) { this.clasificacionFalta = clasificacionFalta; }

    public String getMedidaRecomendada() { return medidaRecomendada; }
    public void setMedidaRecomendada(String medidaRecomendada) { this.medidaRecomendada = medidaRecomendada; }

    public String getArticulosInvocados() { return articulosInvocados; }
    public void setArticulosInvocados(String articulosInvocados) { this.articulosInvocados = articulosInvocados; }

    public Boolean getRequiereComite() { return requiereComite; }
    public void setRequiereComite(Boolean requiereComite) { this.requiereComite = requiereComite; }

    public String getTextoCitacion() { return textoCitacion; }
    public void setTextoCitacion(String textoCitacion) { this.textoCitacion = textoCitacion; }

    public LocalDate getFechaEvaluacion() { return fechaEvaluacion; }
    public void setFechaEvaluacion(LocalDate fechaEvaluacion) { this.fechaEvaluacion = fechaEvaluacion; }

    public String getInstructorResponsable() { return instructorResponsable; }
    public void setInstructorResponsable(String instructorResponsable) { this.instructorResponsable = instructorResponsable; }
}
