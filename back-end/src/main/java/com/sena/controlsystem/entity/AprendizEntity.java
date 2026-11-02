package com.sena.controlsystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "aprendices", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"numero_documento", "ficha_id"})
})
public class AprendizEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaEntity ficha;

    @Column(name = "tipo_documento", nullable = false, length = 10)
    private String tipoDocumento = "CC";

    @Column(name = "numero_documento", nullable = false, length = 25)
    private String numeroDocumento;

    @Column(name = "nombres", nullable = false, length = 150)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 150)
    private String apellidos;

    @Column(name = "correo_institucional", length = 150)
    private String correoInstitucional;

    @Column(name = "celular", length = 30)
    private String celular;

    @Column(name = "estado_sena", length = 50)
    private String estadoSena = "EN FORMACION";

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now();

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    public AprendizEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FichaEntity getFicha() { return ficha; }
    public void setFicha(FichaEntity ficha) { this.ficha = ficha; }

    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

    public String getNumeroDocumento() { return numeroDocumento; }
    public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getNombreCompleto() {
        return (nombres + " " + apellidos).trim();
    }

    public String getCorreoInstitucional() { return correoInstitucional; }
    public void setCorreoInstitucional(String correoInstitucional) { this.correoInstitucional = correoInstitucional; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public String getEstadoSena() { return estadoSena; }
    public void setEstadoSena(String estadoSena) { this.estadoSena = estadoSena; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }

    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
    public void setActualizadoEn(LocalDateTime actualizadoEn) { this.actualizadoEn = actualizadoEn; }
}
