# 1) ETAP BUILD
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1.1) Przywróć pakiety tylko dla projektu API
COPY VocareWebAPI.csproj ./
RUN dotnet restore

# 1.2) Skopiuj resztę plików
COPY . ./

# 1.3) Zainstaluj EF Core tools
RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

# 1.4) Build aplikacji
RUN dotnet build -c Release -o /app/build

# 1.5) Publikuj aplikację
RUN dotnet publish -c Release -o /app/publish

# 2) ETAP RUNTIME - używamy SDK zamiast ASP.NET runtime dla EF tools
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS runtime
WORKDIR /app

# 2.1) Zainstaluj EF Core tools w runtime
RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

# 2.2) Skopiuj opublikowaną aplikację i kod źródłowy (potrzebny do migracji)
COPY --from=build /app/publish .
COPY --from=build /src ./src

# 2.3) Ustaw port i expose
ENV ASPNETCORE_URLS="http://+:8080"
EXPOSE 8080

# 2.4) Uruchomienie (będzie nadpisane przez railway.json)
ENTRYPOINT ["dotnet", "VocareWebAPI.dll"]