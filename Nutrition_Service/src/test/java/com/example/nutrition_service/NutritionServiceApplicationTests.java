package com.example.nutrition_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class NutritionServiceApplicationTests {

	@Test
	void applicationClassIsSpringBootConfiguration() {
		assertNotNull(NutritionServiceApplication.class.getAnnotation(SpringBootApplication.class));
	}

}
