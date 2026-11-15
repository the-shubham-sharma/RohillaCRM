package com.rohilla.crm;

import com.rohilla.crm.common.config.DatabaseUrlEnvironmentPostProcessor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseUrlEnvironmentPostProcessorTests {

    private final DatabaseUrlEnvironmentPostProcessor processor = new DatabaseUrlEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication();

    @Test
    @DisplayName("Processor implements Ordered with LOWEST_PRECEDENCE")
    void testOrderPrecedence() {
        assertEquals(Ordered.LOWEST_PRECEDENCE, processor.getOrder());
    }

    @Test
    @DisplayName("Converts Render postgres:// format to standard JDBC and sets separate DB variables")
    void testRenderPostgresUrlNormalization() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgres://rohilla_user:secret_pass_123@dpg-abc123xyz-a:5432/rohilla_crm");

        processor.postProcessEnvironment(env, application);

        assertEquals("jdbc:postgresql://dpg-abc123xyz-a:5432/rohilla_crm?sslmode=require", env.getProperty("spring.datasource.url"));
        assertEquals("jdbc:postgresql://dpg-abc123xyz-a:5432/rohilla_crm?sslmode=require", env.getProperty("SPRING_DATASOURCE_URL"));
        assertEquals("rohilla_user", env.getProperty("spring.datasource.username"));
        assertEquals("secret_pass_123", env.getProperty("spring.datasource.password"));
        assertEquals("dpg-abc123xyz-a", env.getProperty("DB_HOST"));
        assertEquals("5432", env.getProperty("DB_PORT"));
        assertEquals("rohilla_crm", env.getProperty("DB_NAME"));
        assertEquals("rohilla_user", env.getProperty("DB_USERNAME"));
        assertEquals("secret_pass_123", env.getProperty("DB_PASSWORD"));
    }

    @Test
    @DisplayName("Converts Render postgresql:// format to standard JDBC and sets separate DB variables")
    void testRenderPostgreSqlUrlNormalization() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgresql://admin_user:my_secure_pass@render-db-host:5432/prod_db");

        processor.postProcessEnvironment(env, application);

        assertEquals("jdbc:postgresql://render-db-host:5432/prod_db?sslmode=require", env.getProperty("spring.datasource.url"));
        assertEquals("admin_user", env.getProperty("spring.datasource.username"));
        assertEquals("my_secure_pass", env.getProperty("spring.datasource.password"));
        assertEquals("render-db-host", env.getProperty("DB_HOST"));
        assertEquals("5432", env.getProperty("DB_PORT"));
        assertEquals("prod_db", env.getProperty("DB_NAME"));
        assertEquals("admin_user", env.getProperty("DB_USERNAME"));
        assertEquals("my_secure_pass", env.getProperty("DB_PASSWORD"));
    }

    @Test
    @DisplayName("Preserves query parameters like sslmode=require from Render URL")
    void testPreservesQueryParams() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgresql://user:pass@host:5432/mydb?sslmode=require&connectTimeout=10");

        processor.postProcessEnvironment(env, application);

        assertEquals("jdbc:postgresql://host:5432/mydb?sslmode=require&connectTimeout=10", env.getProperty("spring.datasource.url"));
        assertEquals("user", env.getProperty("spring.datasource.username"));
        assertEquals("pass", env.getProperty("spring.datasource.password"));
        assertEquals("host", env.getProperty("DB_HOST"));
        assertEquals("mydb", env.getProperty("DB_NAME"));
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
