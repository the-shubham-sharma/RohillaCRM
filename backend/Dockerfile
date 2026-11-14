# ==============================================================================
# ROHILLA ADVERTISING CRM — BACKEND DOCKERFILE
# Multi-stage optimized build with Eclipse Temurin 21 JRE Alpine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Application Artifact with Maven
# ------------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy Maven POM and dependency definitions for cache optimization
COPY pom.xml .

# Download dependencies in a separate layer to leverage Docker build cache
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Package production JAR without running unit tests during image build
# (Unit tests are run separately in CI/CD pipeline)
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production JRE Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

# Install curl for container health check
RUN apk add --no-cache curl tzdata

# Create dedicated non-root application user and group for security
RUN addgroup -S crmgroup && adduser -S crmuser -G crmgroup

WORKDIR /app

# Create necessary directories and set ownership
RUN mkdir -p /var/rohilla/storage /app/logs \
    && chown -R crmuser:crmgroup /app /var/rohilla/storage

# Copy built artifact from builder stage
COPY --from=builder --chown=crmuser:crmgroup /build/target/*.jar /app/app.jar

# Run container as non-root user
USER crmuser

# Expose internal Spring Boot application port
EXPOSE 8080

# Environment defaults
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Container healthcheck using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Launch application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
