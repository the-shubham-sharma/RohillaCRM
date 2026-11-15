package com.rohilla.crm.common.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically normalizes cloud PostgreSQL URLs (such as Render's DATABASE_URL: postgres:// or postgresql://)
 * into standard JDBC format (jdbc:postgresql://...) so Spring Boot and HikariCP connect seamlessly.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }

        // Only process URLs that start with postgres:// or postgresql:// (and not already jdbc:)
        if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
            try {
                String uriString = databaseUrl;
                if (uriString.startsWith("postgres://")) {
                    uriString = "postgresql://" + uriString.substring("postgres://".length());
                }

                URI uri = new URI(uriString);
                String userInfo = uri.getUserInfo();
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath(); // e.g. /dbname
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isBlank()) {
                    jdbcUrl.append("?").append(query);
                }

                Map<String, Object> props = new HashMap<>();
                props.put("spring.datasource.url", jdbcUrl.toString());

                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    props.put("spring.datasource.username", parts[0]);
                    props.put("spring.datasource.password", parts[1]);
                }

                environment.getPropertySources().addFirst(
                        new MapPropertySource("renderDatabaseUrlProperties", props)
                );
            } catch (Exception ignored) {
                // If URI parsing fails, allow standard properties to take effect
            }
        }
    }
}
