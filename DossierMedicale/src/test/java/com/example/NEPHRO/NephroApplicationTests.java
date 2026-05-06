package com.example.NEPHRO;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.kidneycare.testsupport.MysqlSpringBootSupport;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class NephroApplicationTests extends MysqlSpringBootSupport {

	@Test
	void contextLoads() {
	}

}
