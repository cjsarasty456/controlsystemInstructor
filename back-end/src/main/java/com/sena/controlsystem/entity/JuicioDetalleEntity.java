package com.sena.controlsystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "juicios_evaluativos_detalle", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"aprendiz_id", "resultado_aprendizaje"})
})
public class JuicioDetalleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaEntity ficha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprendiz_id", nullable = false)
    private AprendizEntity aprendiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargue_id")
    private HistorialCargueEntity cargue;

    @Column(name = "competencia_denominacion", nullable = false, columnDefinition = "TEXT")
    private String competenciaDenominacion;

    @Column(name = "resultado_aprendizaje", nullable = false, columnDefinition = "TEXT")
    private String resultadoAprendizaje;

    @Column(name = "juicio_evaluacion", nullable = false, length = 50)
    private String juicioEvaluacion = "POR EVALUAR"; // APROBADO, NO APROBADO, POR EVALUAR

    @Column(name = "fecha_hora_juicio")
    private LocalDateTime fechaHoraJuicio;

    @Column(name = "funcionario_registro", length = 255)
    private String funcionarioRegistro = "Carlos Julio Cadena";

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now();

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    public JuicioDetalleEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FichaEntity getFicha() { return ficha; }
    public void setFicha(FichaEntity ficha) { this.ficha = ficha; }

    public AprendizEntity getAprendiz() { return aprendiz; }
    public void setAprendiz(AprendizEntity aprendiz) { this.aprendiz = aprendiz; }

    public HistorialCargueEntity getCargue() { return cargue; }
    public void setCargue(HistorialCargueEntity cargue) { this.cargue = cargue; }

    public String getCompetenciaDenominacion() { return competenciaDenominacion; }
    public void setCompetenciaDenominacion(String competenciaDenominacion) { this.competenciaDenominacion = competenciaDenominacion; }

    public String getResultadoAprendizaje() { return resultadoAprendizaje; }
    public void setResultadoAprendizaje(String resultadoAprendizaje) { this.resultadoAprendizaje = resultadoAprendizaje; }

    public String getJuicioEvaluacion() { return juicioEvaluacion; }
    public void setJuicioEvaluacion(String juicioEvaluacion) { this.juicioEvaluacion = juicioEvaluacion; }

    public LocalDateTime getFechaHoraJuicio() { return fechaHoraJuicio; }
    public void setFechaHoraJuicio(LocalDateTime fechaHoraJuicio) { this.fechaHoraJuicio = fechaHoraJuicio; }

    public String getFuncionarioRegistro() { return funcionarioRegistro; }
    public void setFuncionarioRegistro(String funcionarioRegistro) { this.funcionarioRegistro = funcionarioRegistro; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }

    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
    public void setActualizadoEn(LocalDateTime actualizadoEn) { this.actualizadoEn = actualizadoEn; }
}

