# 1) ETAP BUILD
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1.1) Skopiuj .csproj i zależności
COPY VocareWebAPI/VocareWebAPI.csproj ./VocareWebAPI/
COPY Shared/ ./Shared/  

# 1.2) Przywróć zależności
RUN dotnet restore ./VocareWebAPI/VocareWebAPI.csproj --verbosity detailed

# 1.3) Skopiuj resztę projektu
COPY VocareWebAPI/ ./VocareWebAPI/
WORKDIR /src/VocareWebAPI
RUN dotnet publish -c Release -o /app/publish

# 2) ETAP RUNTIME
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_URLS="http://+:8080"
EXPOSE 8080
ENTRYPOINT ["dotnet", "VocareWebAPI.dll"]
