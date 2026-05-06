package com.example.Nutrition_Service;

import com.kidneycare.testsupport.MysqlSpringBootSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class NutritionServiceApplicationTests extends MysqlSpringBootSupport {

	@Test
	void contextLoads() {
	}

}
