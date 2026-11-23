# Audyt wizualny / mobile - vocare.pl (2026-11-23)

Screenshoty: /Users/bartek/Desktop/vocare.pl-audit/screenshots/ ({home,pricing,blog,article}-{desktop 1440,mobile 390}-{atf,full}.png, plus article-mobile-scroll*-nobanner.png)
Metoda: Playwright/Chromium, swiezy kontekst (bez cookies), locale pl-PL, DPR 2 na mobile.

## Above the fold
- H1 "Zaplanuj cala Swoja Kariere" widoczny na desktop (y=254-360) i mobile (y=112-176). Value proposition (podtytul), CTA "Sprawdz za darmo" i 99% / 1200+ widoczne na obu.
- Mobile: CTA "Sprawdz za darmo" na y=308-344 (viewport 844) - nad banerem cookies (baner startuje y=559).
- Baner cookies (fixed, z-9999, bez backdropu blokujacego): desktop 173px (19% viewportu), mobile 285px (34% viewportu). Zasila sie 3 przyciskami, na mobile w 2 rzedach. Zakrywa hero mockup i tresc na kazdej z 4 stron. /pricing mobile: widac tylko H1 + naglowek planu Free, cena i lista funkcji sa pod banerem. Artykul mobile: obrazek hero ucięty przez baner.
- Modal / baner market-news: NIE zaobserwowany w swiezej sesji na zadnej z 4 stron (zero [role=dialog], jedyny fixed overlay = cookies). Na /blog i artykule w drzewie DOM jest przycisk "Zamknij oferte" (28x28) - widget promo, nie pojawil sie w viewporcie przy scrollu do 2500px; nie zweryfikowano.

## Mobile
- Brak poziomego overflow (scrollWidth = 390 na wszystkich stronach). Elementy wystajace tylko dekoracyjne (canvas product-showcase na home, obrazek -rotate-20 na /pricing, blob na artykule) - przycinane przez overflow, bez scrolla poziomego. Artykul: <code> wystaje do r=527px (inline code w tresci) - sprawdzic czy zawija.
- Viewport meta poprawne. Fonty: tresc 14-16px; na home 10-13px dla ~12 elementow (podpisy), na /blog 14px dla ~130 elementow (karty), artykul 16px - OK.
- Tap targets (<44px): home CTA "Sprawdz za darmo" 188x36, "Dowiedz sie wiecej" 183x36, "Jak to dziala?" 155x36; linki nawigacji w menu/stopce 20px wysokosci (Doradca, Analiza, Cennik, Blog...), ikony social 28x28, "Zamknij oferte" 28x28, linki stopki na /blog 16px wysokosci, "Powrot" 38px, przyciski cookies 36px. Hamburger 64x64 OK. 22-34 z 28-54 elementow interaktywnych <44px na stronie.
- Desktop: 34/54 (home) linkow/przyciskow <44px - ale to desktop, mniejszy problem.

## Layout / CLS
- Home desktop: CLS 0.806 po przescrollowaniu strony (jedno przesuniecie 0.576 przy t=9s + seria ~0.01-0.04). Zrodlo: .product-showcase-module__backdrop / canvas (animacja scroll-driven/pin). Przed scrollem CLS=0.006. Mobile 0. Prawdopodobnie artefakt skryptowanego scrolla, ale warto zweryfikowac w CrUX/Lighthouse.
- Pozostale strony: CLS 0.01-0.02 (OK). Obrazki blog/artykul bez width/height w HTML, ale kontener ma stale aspect-ratio, wiec CLS z obrazkow ~0.
- LCP (lab): home 0.9s desktop/1.2s mobile (dashboard-img-2.avif), blog 0.76s, artykul 0.52s - dobre.
- Blog index: 129 obrazkow (wiele duplikatow tych samych plikow - np. job-search.webp x~14, best-paid-jobs x~8) i wysokosc strony 74 447px na mobile / 27 181px desktop - brak paginacji/"load more", bardzo dlugi scroll, ciezki DOM.

## Obrazy (kategoria Images)
Pozytywy: next/image -> AVIF/WebP, hero z fetchpriority=high, reszta loading=lazy, SVG dla ikon, hero pozostaje lekkie (44KB desktop / 83KB mobile), width/height na ikonach i hero, alt na wiekszosci.
Problemy:
1. [Sredni] Home: 6 obrazkow z pustym alt. 3 to dekoracyjne strzalki arrow-1/2/3.svg (OK jako dekoracja, ale lepiej role=presentation/aria-hidden), ale 3 sa tresciowe: karty bloga student-work.webp, job-portals.webp, best-paid-jobs.webp - alt="" ukrywa je dla czytnikow; dodac opisowy alt (lub alt = tytul posta). Dodatkowo /pricing: shape1.avif alt="" (dekoracja, OK). Ikony "expand" i "tile" maja generyczne alt ('expand', 'tile', 'dashboard-img', 'line') - poprawic lub oznaczyc jako dekoracyjne.
2. [Sredni] Blog: /images/blog/career-path.webp wazy 379KB w wariancie mobile (w=828) / 224KB desktop (w=640), przy ok. 15-30KB dla pozostalych - zrodlo nieoptymalne (390x520 w liscie vs 217 innych). Rekompresja do ~30KB.
3. [Sredni] Blog index laduje do 129 <img> (lazy, ale DOM i JS ciezki; ~780KB obrazow po scrollu na mobile). Wprowadzic paginacje/infinite scroll z limitem.
4. [Niski] Hero na mobile pobiera wariant w=1920 (2x wiekszy niz desktop w=750) - atrybut sizes nie jest ustawiony na ~100vw/rozmiar kontenera; zrodlo 2956x2380 AVIF dla renderu 350-589px. Dodac sizes i dedykowany mniejszy plik.
5. [Niski] Obrazki karty bloga bez width/height (polegaja na CSS aspect-ratio) - dodac atrybuty. Karty na mobile maja 390px intrinsic dla 346 css px przy DPR 2 (lekko miekkie na retinie) - rozwazyc sizes="(max-width:768px) 100vw".
6. [Niski] Logo /icons/vocare.png (256x64) renderowane 164x41; PNG->webp przez next/image OK. Posters wideo na home (/videos/*-poster.webp) 61-90KB kazdy x4 (~300KB) - pobierane przy ladowaniu, rozwazyc lazy/mniejsze.
7. [Niski] Ikona instagram 73x73 renderowana 30x30 (SVG, bez znaczenia).

## Wynik Images: 74 / 100

## Rekomendacje priorytetowe
1. Baner cookies na mobile: skrocic tekst, jeden rzad przyciskow, ew. kompaktowa wersja (max ~150px) - dzis zajmuje 34% ekranu i zaslania tresc /pricing.
2. Powiekszyc tap targets (CTA 44px min, linki nawigacji/stopki, social 44px, zamkniecie oferty).
3. Alt dla 3 kart bloga na home i generyczne alt-y; oznaczyc dekoracje.
4. Paginacja na /blog; kompresja career-path.webp; sizes dla hero.
5. Zbadac CLS 0.8 sekcji product-showcase przy scrollu (desktop).
