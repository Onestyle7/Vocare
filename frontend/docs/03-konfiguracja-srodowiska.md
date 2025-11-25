# 3.3 Konfiguracja środowiska i zależności

## 3.3.1 Zależności i menedżer pakietów
- Frontend korzysta z Node.js 18+/20 (zgodnie z CI) oraz menedżera npm; podstawowe skrypty (`dev`, `build`, `start`, `lint`, `format`) są zdefiniowane w `package.json`, co umożliwia jednolity sposób uruchamiania aplikacji w różnych środowiskach.
- Główne zależności projektowe to Next.js 15.2.3, React 19.1.0, TypeScript 5, zestaw Radix UI, biblioteki animacji (`gsap`, `framer-motion`, `lenis`), walidacja `react-hook-form` + `@hookform/resolvers` + `zod`, narzędzia do PDF/HTML2Canvas oraz wizualizacje 3D (`three`, `@react-three/*`).
- W `devDependencies` zdefiniowano ESLint 9 z `eslint-config-next`, Prettier 3 z wtyczką `prettier-plugin-tailwindcss` oraz Tailwind CSS 4, co pozwala zachować spójność stylów i jakości kodu.

## 3.3.2 Zmienne środowiskowe i konfiguracja Next.js
- Plik `next.config.ts` wymusza tryb `reactStrictMode`, transpile’uje paczki `gsap` i `lenis`, a także wstrzykuje zmienną `NEXT_PUBLIC_API_URL` do bundla, dzięki czemu API backendu może być konfigurowane per środowisko (dev/stg/prod) bez zmian w kodzie.
- Konfiguracja obrazów dopuszcza zewnętrzne źródła (Unsplash, GitHub Avatars), co jest istotne dla prezentacji profili i zasobów marketingowych.

## 3.3.3 Uruchamianie lokalne (dev)
- W środowisku developerskim aplikację uruchamia się poleceniem `npm run dev`, które startuje serwer Next.js z HMR na porcie 3000. Wymagane jest ustawienie `NEXT_PUBLIC_API_URL` (np. `http://localhost:8080/api`) w `.env.local` lub zmiennych systemowych.
- Lintowanie (`npm run lint`) i formatowanie (`npm run format`) są dostępne lokalnie, co wspiera standardy kodu przed pushem.

## 3.3.4 Build i uruchomienie produkcyjne (stg/prod)
- Wieloetapowy `Dockerfile` pozwala zbudować obraz w etapie `builder` z zadeklarowanym `ARG NEXT_PUBLIC_API_URL`, który trafia do `ENV` na czas kompilacji Next.js; etap `runner` kopiuje artefakty `.next`, `public`, `node_modules` i uruchamia `npm start` na porcie 3000.
- Ten sam obraz może być użyty w stagingu i produkcji, różniąc się jedynie wartością `NEXT_PUBLIC_API_URL` przekazywaną podczas budowy lub uruchomienia (np. przez `--build-arg` w CI/CD).
- Na platformach typu Vercel wystarczy ustawić `NEXT_PUBLIC_API_URL` jako zmienną środowiskową projektu oraz dodać komendę build (`npm run build`); artefakty są serwowane przez serwer Vercel bez konieczności własnego kontenera, choć Docker umożliwia alternatywny deploy (np. Railway/Kubernetes).

## 3.3.5 CI/CD i podział na środowiska
- GitHub Actions buduje frontend na gałęzi `develop` używając Node.js 20; pipeline cache’uje `node_modules`, wykonuje `npm ci`, `npm run build` oraz opcjonalny `npm run test`, a następnie publikuje artefakt `frontend-build` możliwy do wykorzystania w deployu na staging/produkcję.
- Wspólny pipeline może być rozszerzony o macierz środowisk (dev/stg/prod) przez przekazanie różnych wartości `NEXT_PUBLIC_API_URL` jako `build-arg` (Docker) lub `env` (Vercel), co zapewnia hermetyczne konfiguracje bez zmian w repozytorium.
- Rozdzielenie środowisk można wymusić także na poziomie gałęzi: `develop` → staging, `main` → production; w obu przypadkach zmienne środowiskowe i build-arg pozostają jedynym miejscem różnic.

## 3.3.6 Zarządzanie tajnymi danymi
- Frontend korzysta wyłącznie z jawnej zmiennej `NEXT_PUBLIC_API_URL`; klucze prywatne i tokeny nie są potrzebne w bundlu. Sekrety (np. tokeny do usług zewnętrznych) powinny być przechowywane w panelu Vercel/GitHub Actions jako `secrets` i przekazywane do backendu, a nie do kodu klienta.

## 3.3.7 Checklisty środowiskowe
- Dev: `NEXT_PUBLIC_API_URL=http://localhost:8080/api`, `npm run dev`, lint/format lokalnie.
- Staging: `NEXT_PUBLIC_API_URL=https://stg.api.vocare.example/api`, build poprzez Docker (`--build-arg NEXT_PUBLIC_API_URL=...`) lub Vercel env, deploy z artefaktu `frontend-build` z gałęzi `develop`.
- Production: `NEXT_PUBLIC_API_URL=https://api.vocare.example/api`, build na gałęzi `main`, ten sam obraz kontenerowy lub pipeline Vercel z włączonym `npm run build`.
