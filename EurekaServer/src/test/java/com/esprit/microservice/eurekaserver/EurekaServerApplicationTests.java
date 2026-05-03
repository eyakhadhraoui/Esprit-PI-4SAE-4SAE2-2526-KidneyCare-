package com.esprit.microservice.eurekaserver;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.autoconfigure.exclude=" +
            "org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration," +
            "org.springframework.cloud.netflix.eureka.server.EurekaServerJerseyClientAutoConfiguration," +
            "org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration"
    }
)
@ActiveProfiles("test")
class EurekaServerApplicationTests {

    @Test
    void contextLoads() {
    }

}
