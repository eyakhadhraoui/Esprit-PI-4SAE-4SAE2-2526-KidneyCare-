package com.esprit.microservice.eurekaserver;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "eureka.client.enabled=false",
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false",
        "spring.cloud.config.enabled=false",
        "spring.autoconfigure.exclude=" +
            "org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration," +
            "org.springframework.cloud.netflix.eureka.server.EurekaServerJerseyClientAutoConfiguration," +
            "org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration," +
            "org.springframework.cloud.netflix.eureka.EurekaDiscoveryClientConfiguration"
    }
)
@ActiveProfiles("test")
class EurekaServerApplicationTests {

    @Test
    void contextLoads() {
    }

}
