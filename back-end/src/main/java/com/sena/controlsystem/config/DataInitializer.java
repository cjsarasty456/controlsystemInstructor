package com.sena.controlsystem.config;

import com.sena.controlsystem.entity.AprendizEntity;
import com.sena.controlsystem.entity.FichaEntity;
import com.sena.controlsystem.entity.HistorialCargueEntity;
import com.sena.controlsystem.entity.JuicioDetalleEntity;
import com.sena.controlsystem.repository.AprendizRepository;
import com.sena.controlsystem.repository.FichaRepository;
import com.sena.controlsystem.repository.HistorialCargueRepository;
import com.sena.controlsystem.repository.JuicioDetalleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final FichaRepository fichaRepository;
    private final AprendizRepository aprendizRepository;
    private final JuicioDetalleRepository juicioDetalleRepository;
    private final HistorialCargueRepository historialCargueRepository;

    public DataInitializer(
            FichaRepository fichaRepository,
            AprendizRepository aprendizRepository,
            JuicioDetalleRepository juicioDetalleRepository,
            HistorialCargueRepository historialCargueRepository) {
        this.fichaRepository = fichaRepository;
        this.aprendizRepository = aprendizRepository;
        this.juicioDetalleRepository = juicioDetalleRepository;
        this.historialCargueRepository = historialCargueRepository;
    }

    @Override
    public void run(String... args) {
        Optional<FichaEntity> fOpt = fichaRepository.findByNumeroFicha("3145556");
        if (fOpt.isEmpty()) return;

        FichaEntity ficha = fOpt.get();
        if (aprendizRepository.countByFichaId(ficha.getId()) > 0) return;

        // Semilla de Aprendices Iniciales para Pruebas en Ficha 3145556
        String[][] learnersData = {
                {"1075254123", "Carlos Julio", "Cadena Sarasty", "0.75"},
                {"1075345678", "Andrea Carolina", "Morales Puentes", "0.90"},
                {"1075987654", "Juan Camilo", "Perdomo Silva", "0.45"},
                {"1080123456", "Valentina", "Vargas Rojas", "0.65"},
                {"1081654321", "Brayan Stiven", "Ortiz Mendez", "0.30"}
        };

        // RAPs oficiales del Proyecto ADSO 2417180
        String[] competencias = {
                "220501092 - ESPECIFICACIÓN DE REQUISITOS DEL SOFTWARE",
                "220501093 - EVALUACIÓN DE REQUISITOS DEL SOFTWARE",
                "220501094 - DISEÑO DEL SOFTWARE",
                "220501095 - DESARROLLO DE LA ESTRUCTURA DE LA BASE DE DATOS",
                "220501096 - DESARROLLO DE COMPONENTES FRONT-END",
                "220501097 - DESARROLLO DE LA LÓGICA DE NEGOCIO DEL BACK-END",
                "220501098 - IMPLANTACIÓN Y VERIFICACIÓN DE LA ARQUITECTURA"
        };

        List<String[]> rapsList = new ArrayList<>();
        int rapSeq = 1;
        for (String c : competencias) {
            for (int r = 1; r <= 4; r++) {
                String rapName = String.format("5923%02d - %02d APLICAR BUENAS PRÁCTICAS EN %s (RAP %02d)", rapSeq, r, c.split("-")[1].trim(), rapSeq);
                rapsList.add(new String[]{c, rapName});
                rapSeq++;
            }
        }

        int totalAprobados = 0;
        int totalPendientes = 0;
        int totalNoAprobados = 0;

        for (String[] lMeta : learnersData) {
            AprendizEntity apr = new AprendizEntity();
            apr.setFicha(ficha);
            apr.setTipoDocumento("CC");
            apr.setNumeroDocumento(lMeta[0]);
            apr.setNombres(lMeta[1]);
            apr.setApellidos(lMeta[2]);
            apr.setEstadoSena("EN FORMACION");
            apr.setCorreoInstitucional(lMeta[1].toLowerCase().replace(" ", "") + "@soy.sena.edu.co");
            apr = aprendizRepository.save(apr);

            double target = Double.parseDouble(lMeta[3]);
            int cutoff = (int) (rapsList.size() * target);

            for (int i = 0; i < rapsList.size(); i++) {
                String[] rapInfo = rapsList.get(i);
                JuicioDetalleEntity j = new JuicioDetalleEntity();
                j.setFicha(ficha);
                j.setAprendiz(apr);
                j.setCompetenciaDenominacion(rapInfo[0]);
                j.setResultadoAprendizaje(rapInfo[1]);

                if ("1075987654".equals(apr.getNumeroDocumento()) && (i == 3 || i == 7)) {
                    j.setJuicioEvaluacion("NO APROBADO");
                    j.setFechaHoraJuicio(LocalDateTime.of(2026, 2, 20, 14, 15));
                    totalNoAprobados++;
                } else if (i < cutoff) {
                    j.setJuicioEvaluacion("APROBADO");
                    j.setFechaHoraJuicio(LocalDateTime.of(2026, 2, 15, 10, 30));
                    totalAprobados++;
                } else {
                    j.setJuicioEvaluacion("POR EVALUAR");
                    j.setFechaHoraJuicio(null);
                    totalPendientes++;
                }

                j.setFuncionarioRegistro("Carlos Julio Cadena (Instructor)");
                juicioDetalleRepository.save(j);
            }
        }

        HistorialCargueEntity cargue = new HistorialCargueEntity();
        cargue.setFicha(ficha);
        cargue.setConsecutivoCargue(1);
        cargue.setNombreArchivoOriginal("Reporte_Juicios_3145556_Oficial.xls");
        cargue.setHashSha256("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        cargue.setFechaReporteSena(LocalDate.of(2026, 2, 15));
        cargue.setFechaCargue(LocalDateTime.now());
        cargue.setTotalFilasProcesadas(rapsList.size() * learnersData.length);
        cargue.setAprendicesAfectados(learnersData.length);
        cargue.setJuiciosNuevosAprobados(totalAprobados);
        cargue.setJuiciosPendientes(totalPendientes);
        cargue.setJuiciosNoAprobados(totalNoAprobados);
        cargue.setSubidoPor("Carlos Julio Cadena (Instructor)");
        cargue.setObservaciones("Cargue inicial sincronizado desde SOFIA Plus con deduplicación y persistencia en PostgreSQL.");
        historialCargueRepository.save(cargue);
    }
}
