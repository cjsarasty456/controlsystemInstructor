package com.sena.controlsystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API REST Sistema de Control de Instructores SENA")
                        .version("1.0.0")
                        .description("Especificación OpenAPI 3 / Swagger para los servicios de gestión académica, " +
                                "seguimiento de juicios evaluativos RAPs por fases, deduplicación de aprendices, " +
                                "evaluación con el Reglamento del Aprendiz y copias de seguridad en PostgreSQL 18.")
                        .contact(new Contact()
                                .name("Carlos Julio Cadena — Instructor Técnico ADSO")
                                .email("carlos.cadena@soy.sena.edu.co")
                                .url("https://www.sena.edu.co"))
                        .license(new License()
                                .name("Uso Institucional SENA — CIES Regional Huila")
                                .url("https://www.sena.edu.co")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Servidor Local de Desarrollo (Spring Boot 3 + PostgreSQL 18)")
                ));
    }
}

