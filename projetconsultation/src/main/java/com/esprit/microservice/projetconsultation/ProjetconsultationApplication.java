package com.esprit.microservice.projetconsultation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class ProjetconsultationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjetconsultationApplication.class, args);
    }

}
