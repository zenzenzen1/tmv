# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# 优化构建缓存：先只拷贝 pom.xml 进行依赖下载
COPY pom.xml ./
RUN mvn -q -e -B -DskipTests dependency:go-offline

# 再拷贝源码并打包
COPY src ./src
RUN mvn -q -e -B -DskipTests package

# ---------- Runtime stage ----------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

COPY --from=build /build/target/fvc-api-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]


