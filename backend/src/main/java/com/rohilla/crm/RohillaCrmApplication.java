package com.rohilla.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableMethodSecurity(prePostEnabled = true)
public class RohillaCrmApplication {

    public static void main(String[] args) {
        SpringApplication.run(RohillaCrmApplication.class, args);
    }
}
