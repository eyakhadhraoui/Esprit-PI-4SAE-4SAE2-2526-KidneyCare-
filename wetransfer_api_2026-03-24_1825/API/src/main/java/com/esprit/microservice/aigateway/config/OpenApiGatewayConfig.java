package com.esprit.microservice.aigateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiGatewayConfig {

    @Bean
    public OpenAPI gatewayOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("KidneyCare API Gateway")
                        .description("Documentation agrégée des microservices KidneyCare")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("KidneyCare")
                                .email("kidneycare@esprit.tn")));
    }
}
