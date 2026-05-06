# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q -B
COPY src src/
RUN mvn clean package -Dmaven.test.skip=true -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/EurekaServer-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8761

HEALTHCHECK --interval=15s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8761/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
