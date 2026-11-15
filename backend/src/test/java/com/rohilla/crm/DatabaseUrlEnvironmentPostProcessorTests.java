package com.rohilla.crm;

import com.rohilla.crm.common.config.DatabaseUrlEnvironmentPostProcessor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseUrlEnvironmentPostProcessorTests {

    private final DatabaseUrlEnvironmentPostProcessor processor = new DatabaseUrlEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication();

    @Test
    @DisplayName("Converts Render postgres:// format to standard JDBC with user and password")
    void testRenderPostgresUrlNormalization() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgres://rohilla_user:secret_pass_123@dpg-abc123xyz-a:5432/rohilla_crm");

        processor.postProcessEnvironment(env, application);

        assertEquals("jdbc:postgresql://dpg-abc123xyz-a:5432/rohilla_crm", env.getProperty("spring.datasource.url"));
        assertEquals("rohilla_user", env.getProperty("spring.datasource.username"));
        assertEquals("secret_pass_123", env.getProperty("spring.datasource.password"));
    }

    @Test
    @DisplayName("Converts Render postgresql:// format to standard JDBC with user and password")
    void testRenderPostgreSqlUrlNormalization() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgresql://admin_user:my_secure_pass@render-db-host:5432/prod_db");

        processor.postProcessEnvironment(env, application);

        assertEquals("jdbc:postgresql://render-db-host:5432/prod_db", env.getProperty("spring.datasource.url"));
        assertEquals("admin_user", env.getProperty("spring.datasource.username"));
        assertEquals("my_secure_pass", env.getProperty("spring.datasource.password"));
    }

    @Test
    @DisplayName("Preserves query parameters like sslmode=require from Render URL")
    void testPreservesQueryParams() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgresql://user:pass@host:5432/mydb?sslmode=require");

        processor.postProcessEnvironment(env, application);

        assertEquals("jdbc:postgresql://host:5432/mydb?sslmode=require", env.getProperty("spring.datasource.url"));
        assertEquals("user", env.getProperty("spring.datasource.username"));
        assertEquals("pass", env.getProperty("spring.datasource.password"));
    }

    @Test
    @DisplayName("Does not alter already-standard JDBC URL")
    void testIgnoresStandardJdbcUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "jdbc:postgresql://localhost:5432/rohilla_crm");

        processor.postProcessEnvironment(env, application);

        assertNull(env.getProperty("spring.datasource.url"));
        assertNull(env.getProperty("spring.datasource.username"));
    }

    @Test
    @DisplayName("Handles null and empty DATABASE_URL gracefully")
    void testHandlesNullAndEmptyGracefully() {
        MockEnvironment env = new MockEnvironment();
        processor.postProcessEnvironment(env, application);
        assertNull(env.getProperty("spring.datasource.url"));

        env.setProperty("DATABASE_URL", "   ");
        processor.postProcessEnvironment(env, application);
        assertNull(env.getProperty("spring.datasource.url"));
    }
}
