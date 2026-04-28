# Dockerfile pour le service NEPHRO

# Étape 1 : Build (optionnel si on utilise les JARs du pipeline)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Runtime
FROM eclipse-temurin:17-jre
WORKDIR /app

# Installation de Tesseract OCR (si nécessaire, comme indiqué dans application.properties)
RUN apt-get update && apt-get install -y tesseract-ocr && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8089

ENTRYPOINT ["java", "-jar", "app.jar"]
