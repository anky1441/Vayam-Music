# ==========================================
# Multi-Stage Dockerfile for Spring Boot App
# ==========================================

# 1. Build Stage
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy pom.xml and download dependencies first (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# 2. Runtime Stage
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

# Install wget for container healthcheck
RUN apk add --no-cache wget

# Create a secure non-root user and group
RUN addgroup -S vayam && adduser -S vayam -G vayam
USER vayam:vayam

# Copy executable jar from builder stage
COPY --from=builder --chown=vayam:vayam /app/target/*.jar app.jar

# Container configuration: defaults to port 8080, automatically adapts to Render/cloud PORT
ENV PORT=8080 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

# Health check to verify service availability
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8080}/api/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
