package com.kidneycare.testsupport;

import java.util.Objects;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Tests sans Docker : H2 en mémoire via {@code application-test.properties}.
 * Si {@code SPRING_DATASOURCE_URL} est défini (CI), une base JDBC externe remplace H2.
 */
@ActiveProfiles("test")
public abstract class MysqlSpringBootSupport {

    @DynamicPropertySource
    static void optionalExternalDatasource(DynamicPropertyRegistry registry) {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        if (url != null && !url.isBlank()) {
            registry.add("spring.datasource.url", () -> Objects.requireNonNull(url));
            registry.add("spring.datasource.username",
                    () -> firstNonBlank(System.getenv("SPRING_DATASOURCE_USERNAME"), "root"));
            registry.add("spring.datasource.password", () -> nullToEmpty(System.getenv("SPRING_DATASOURCE_PASSWORD")));
        }
    }

    private static String firstNonBlank(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
