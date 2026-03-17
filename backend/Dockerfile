# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/BabyTracker.Domain/BabyTracker.Domain.csproj src/BabyTracker.Domain/
COPY src/BabyTracker.Application/BabyTracker.Application.csproj src/BabyTracker.Application/
COPY src/BabyTracker.Infrastructure/BabyTracker.Infrastructure.csproj src/BabyTracker.Infrastructure/
COPY src/BabyTracker.Api/BabyTracker.Api.csproj src/BabyTracker.Api/
RUN dotnet restore src/BabyTracker.Api/BabyTracker.Api.csproj

COPY src/ src/
RUN dotnet publish src/BabyTracker.Api/BabyTracker.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/uploads
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "BabyTracker.Api.dll"]
