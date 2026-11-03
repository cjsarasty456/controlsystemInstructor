package com.sena.controlsystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluaciones_reglamento")
public class EvaluacionReglamentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaEntity ficha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprendiz_id", nullable = false)
    private AprendizEntity aprendiz;

    @Column(name = "motivo", nullable = false, length = 50)
    private String motivo; // ACADEMICO, INASISTENCIA, DESERCION, DISCIPLINARIO

    @Column(name = "gravedad", nullable = false, length = 20)
    private String gravedad; // LEVE, GRAVE, GRAVISIMA

    @Column(name = "clasificacion_falta", nullable = false, length = 150)
    private String clasificacionFalta;

    @Column(name = "medida_recomendada", nullable = false, columnDefinition = "TEXT")
    private String medidaRecomendada;

    @Column(name = "articulos_invocados", columnDefinition = "TEXT")
    private String articulosInvocados;

    @Column(name = "requiere_comite")
    private Boolean requiereComite = false;

    @Column(name = "texto_citacion", columnDefinition = "TEXT")
    private String textoCitacion;

    @Column(name = "fecha_evaluacion", nullable = false)
    private LocalDate fechaEvaluacion = LocalDate.now();

    @Column(name = "instructor_responsable", length = 150)
    private String instructorResponsable = "Carlos Julio Cadena";

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now();

    public EvaluacionReglamentoEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FichaEntity getFicha() { return ficha; }
    public void setFicha(FichaEntity ficha) { this.ficha = ficha; }

    public AprendizEntity getAprendiz() { return aprendiz; }
    public void setAprendiz(AprendizEntity aprendiz) { this.aprendiz = aprendiz; }

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

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
}

