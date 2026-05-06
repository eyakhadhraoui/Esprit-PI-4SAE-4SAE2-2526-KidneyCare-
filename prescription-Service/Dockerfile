# Stage 1 supprimé - Maven tourne dans Jenkins Pipeline
# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY target/*.jar app.jar
CMD ["java", "-jar", "app.jar"]
