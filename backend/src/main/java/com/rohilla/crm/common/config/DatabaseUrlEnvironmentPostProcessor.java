package com.rohilla.crm.common.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically normalizes cloud PostgreSQL URLs (such as Render's DATABASE_URL: postgres:// or postgresql://)
 * into standard JDBC format (jdbc:postgresql://...) and extracts separate DB_HOST, DB_PORT, DB_NAME,
 * DB_USERNAME, DB_PASSWORD environment properties so Spring Boot and HikariCP connect seamlessly.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public int getOrder() {
        // Execute after ConfigDataEnvironmentPostProcessor so all config files are loaded
        return Ordered.LOWEST_PRECEDENCE;
    }

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
                String dbName = (path != null && path.startsWith("/")) ? path.substring(1) : path;
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path != null ? path : "");

                if (query != null && !query.isBlank()) {
                    jdbcUrl.append("?").append(query);
                } else if (!"localhost".equalsIgnoreCase(host) && !"postgres".equalsIgnoreCase(host)) {
                    jdbcUrl.append("?sslmode=require");
                }

                Map<String, Object> props = new HashMap<>();
                props.put("spring.datasource.url", jdbcUrl.toString());
                props.put("SPRING_DATASOURCE_URL", jdbcUrl.toString());
                props.put("JDBC_DATABASE_URL", jdbcUrl.toString());

                if (host != null) {
                    props.put("DB_HOST", host);
                }
                props.put("DB_PORT", String.valueOf(port));
                if (dbName != null && !dbName.isBlank()) {
                    props.put("DB_NAME", dbName);
                }

                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    props.put("spring.datasource.username", parts[0]);
                    props.put("DB_USERNAME", parts[0]);
                    props.put("spring.datasource.password", parts[1]);
                    props.put("DB_PASSWORD", parts[1]);
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
