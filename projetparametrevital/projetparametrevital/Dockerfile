# Image runtime uniquement — le JAR est produit par Maven (CI / `mvn package`).

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY target/*.jar /tmp/jars/
RUN set -e && \
    J="$(ls /tmp/jars/*.jar | grep -v -- '-plain\.jar$' | head -n1)" && \
    test -n "$J" || (echo "ERROR: aucun Spring Boot executable JAR dans target/ (voir *-plain.jar exclu)." >&2 && ls -la /tmp/jars >&2 && exit 1) && \
    mv "$J" /app/app.jar && rm -rf /tmp/jars

CMD ["java", "-jar", "app.jar"]
