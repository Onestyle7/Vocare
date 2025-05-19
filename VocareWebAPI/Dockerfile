# 1) ETAP BUILD
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1.1) Przywróć pakiety tylko dla projektu API
COPY VocareWebAPI/VocareWebAPI.csproj ./VocareWebAPI.csproj
RUN dotnet restore

# 1.2) Skopiuj resztę plików i opublikuj
COPY ./VocareWebAPI/. ./
RUN dotnet publish -c Release -o /app/publish

# 2) ETAP RUNTIME
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# 2.1) Przenieś wyjście z builda
COPY --from=build /app/publish ./

# 2.2) Ustaw port i expose
ENV ASPNETCORE_URLS="http://+:8080"
EXPOSE 8080

# 2.3) Uruchomienie
ENTRYPOINT ["dotnet", "VocareWebAPI.dll"]
