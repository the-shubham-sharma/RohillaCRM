package com.rohilla.crm;

import com.rohilla.crm.common.config.DatabaseUrlEnvironmentPostProcessor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockPropertySource;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ProductionDataSourceConfigurationTests {

    private final YamlPropertySourceLoader yamlLoader = new YamlPropertySourceLoader();
    private final DatabaseUrlEnvironmentPostProcessor processor = new DatabaseUrlEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication();

    private StandardEnvironment createProdEnvironment(MockPropertySource customProperties) throws IOException {
        StandardEnvironment env = new StandardEnvironment();
        if (customProperties != null) {
            env.getPropertySources().addFirst(customProperties);
        }

        // Load application-prod.yml
        ClassPathResource resource = new ClassPathResource("application-prod.yml");
        List<PropertySource<?>> loadedSources = yamlLoader.load("application-prod.yml", resource);
        for (PropertySource<?> source : loadedSources) {
            env.getPropertySources().addLast(source);
        }

        // Run processor
        processor.postProcessEnvironment(env, application);
        return env;
    }

    @Test
    @DisplayName("Production profile builds valid PostgreSQL JDBC URL from separate DB environment variables")
    void testSeparateDbEnvironmentVariables() throws IOException {
        MockPropertySource props = new MockPropertySource("testProps")
                .withProperty("DB_HOST", "dpg-cxxxxxxx-a.oregon-postgres.render.com")
                .withProperty("DB_PORT", "5432")
                .withProperty("DB_NAME", "rohilla_crm_prod")
                .withProperty("DB_USERNAME", "rohilla_admin")
                .withProperty("DB_PASSWORD", "my_strong_password");

        StandardEnvironment env = createProdEnvironment(props);

        String resolvedUrl = env.getProperty("spring.datasource.url");
        String resolvedUser = env.getProperty("spring.datasource.username");
        String resolvedPass = env.getProperty("spring.datasource.password");
        String resolvedDriver = env.getProperty("spring.datasource.driverClassName");
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto");

        assertNotNull(resolvedUrl);
        assertTrue(resolvedUrl.startsWith("jdbc:postgresql://"), "URL must start with jdbc:postgresql://");
        assertEquals("jdbc:postgresql://dpg-cxxxxxxx-a.oregon-postgres.render.com:5432/rohilla_crm_prod?sslmode=require", resolvedUrl);
        assertEquals("rohilla_admin", resolvedUser);
        assertEquals("my_strong_password", resolvedPass);
        assertEquals("org.postgresql.Driver", resolvedDriver);
        assertEquals("update", ddlAuto);
    }

    @Test
    @DisplayName("Production profile with Render postgresql:// DATABASE_URL normalizes to valid JDBC URL")
    void testRenderDatabaseUrlNormalizesInProdProfile() throws IOException {
        MockPropertySource props = new MockPropertySource("testProps")
                .withProperty("DATABASE_URL", "postgresql://rohilla_user:render_pass_999@dpg-abc123xyz-a:5432/rohilla_crm_db");

        StandardEnvironment env = createProdEnvironment(props);

        String resolvedUrl = env.getProperty("spring.datasource.url");
        String resolvedUser = env.getProperty("spring.datasource.username");
        String resolvedPass = env.getProperty("spring.datasource.password");

        assertNotNull(resolvedUrl);
        assertTrue(resolvedUrl.startsWith("jdbc:postgresql://"), "URL must start with jdbc:postgresql://");
        assertEquals("jdbc:postgresql://dpg-abc123xyz-a:5432/rohilla_crm_db?sslmode=require", resolvedUrl);
        assertEquals("rohilla_user", resolvedUser);
        assertEquals("render_pass_999", resolvedPass);
    }

    @Test
    @DisplayName("Production profile respects HIBERNATE_DDL_AUTO override")
    void testHibernateDdlAutoOverride() throws IOException {
        MockPropertySource props = new MockPropertySource("testProps")
                .withProperty("HIBERNATE_DDL_AUTO", "validate");

        StandardEnvironment env = createProdEnvironment(props);

        assertEquals("validate", env.getProperty("spring.jpa.hibernate.ddl-auto"));
    }
}
