package com.example.Nutrition_Service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient

@SpringBootApplication
public class NutritionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(NutritionServiceApplication.class, args);
	}

}
