package org.example.infectionetvaccination;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.kidneycare.testsupport.MysqlSpringBootSupport;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PiMicroServiceApplicationTests extends MysqlSpringBootSupport {

    @Test
    void contextLoads() {
    }

}
