FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build
COPY . .
RUN mvn -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /build/target/*.jar app.jar
CMD ["java", "-jar", "app.jar"]
