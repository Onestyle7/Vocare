# Struktura serwisu — vocare.pl (stan docelowy)

Legenda: ✅ istnieje · 🔧 istnieje, do zmiany · ➕ nowe · ↪ przekierowanie 301 · 🚫 noindex

```
/                                   🔧 home: jedno H1 z frazą, bez duplikatu intencji z /assistant
│
├── Narzędzia (strony docelowe = działające narzędzia)
│   ├── /resume-creator             🔧 tryb gościa (edytor + PDF bez konta), „Darmowy kreator CV” w title/H1, WebApplication
│   │   ├── /resume-creator/sprawdz-cv        ➕ darmowy mini-audyt CV pod ATS (3 poprawki bez tokenów)
│   │   └── /resume-creator/dopasuj-do-oferty ➕ landing TailorCv („cv dopasowane do oferty”)
│   ├── /salary-calculator          🔧 + netto→brutto, porównanie UoP/zlecenie/B2B, WebApplication
│   ├── /assistant                  🔧 doradca AI; odróżnić intencję od home („doradca kariery AI”)
│   │   └── /assistant/test-kierunku-kariery  ➕ darmowy quiz z wynikiem częściowym (vs Jobbli/123test)
│   ├── /roadmap                    ✅ landing roadmapy
│   └── /market-analysis            ✅ landing analizy rynku
│
├── Dane (nowe — przewaga konkurencyjna)
│   ├── /zarobki                    ➕ hub: lista stanowisk, metodologia, data aktualizacji
│   │   └── /zarobki/{stanowisko}   ➕ programatyczne z JobOffers — TYLKO gdy próba ≥ próg; poniżej progu 🚫 noindex
│   │       (mediana, widełki, B2B vs UoP, top umiejętności, link: kalkulator, roadmapa, CV dla zawodu)
│   └── /raport                     ➕ kwartalne raporty rynku pracy (strona + PDF), Dataset schema
│       └── /raport/{yyyy-qN}
│
├── /pricing                        🔧 SoftwareApplication + Offer, BreadcrumbList
│
├── /porownanie                     ➕ hub porównań (uczciwe, z datą weryfikacji)
│   ├── /porownanie/vocare-vs-canva           ➕ CV dla ATS vs CV graficzne
│   ├── /porownanie/vocare-vs-enhancv         ➕
│   └── /porownanie/doradca-ai-vs-doradca-zawodowy ➕ (albo jako artykuł w /blog/kariera)
│
├── /blog                           🔧 paginacja SSR (24/str.), Blog schema z @id
│   ├── /blog/cv          (filar: /blog/cv/cv)
│   │   ├── /blog/cv/jak-zrobic-cv            ↪ /blog/cv/cv   (po potwierdzeniu w GSC)
│   │   ├── /blog/cv/jak-napisac-list-motywacyjny ↪ /blog/cv/list-motywacyjny
│   │   ├── /blog/cv/darmowy-kreator-cv       ↪ /resume-creator
│   │   ├── /blog/cv/kreator-cv               🔧 → „Ranking kreatorów CV 2026” z metodologią i ujawnieniem
│   │   ├── /blog/cv/cv-do-pracy              🔧 → „Jak dopasować CV do oferty” (link do TailorCv)
│   │   └── /blog/cv/cv-{zawód} (10)          🔧 link do filara + do /zarobki/{zawód}
│   ├── /blog/praca       (filar: /blog/praca/jak-znalezc-prace)
│   │   └── ➕ filar „Prawa pracownika 2026” dla ~20 artykułów prawnych bez huba
│   ├── /blog/kariera     (filar: /blog/kariera/sciezka-kariery)
│   │   └── /blog/kariera/doradztwo-zawodowe  ↪ /blog/kariera/doradca-zawodowy
│   └── /blog/rynek-pracy (filar: /blog/rynek-pracy/rynek-pracy-w-polsce)
│       └── /blog/rynek-pracy/najlepiej-platne-zawody 🔧 dane własne + GUS, tabela, linki do /zarobki
│
├── /autor/{slug}                   ➕ strony autorów (Person, bio, sameAs) — tylko prawdziwe osoby
├── /o-nas                          ➕ kto, misja, kontakt, Organization z disambiguatingDescription
├── /kontakt                        ➕ (może być sekcją /o-nas)
├── /privacy-policy, /terms-of-service ✅
│
└── Prywatne (bez zmian)            /dashboard/*, /resume/*, /roadmap/* → 307 /sign-in 🚫; /sign-in, /sign-up 🚫
```

## Linkowanie wewnętrzne (zasady)

| Z | Do | Reguła |
|---|---|---|
| Każdy artykuł | filar swojej kategorii | obowiązkowo, w pierwszych 30% treści |
| Artykuły o wynagrodzeniach (~15) | `/salary-calculator` + `/zarobki/{stanowisko}` | kontekstowo, nie tylko w CTA |
| `cv-{zawód}` | `/zarobki/{zawód}` + `/resume-creator` | „CV dla analityka” ↔ „Zarobki analityka” |
| `/zarobki/{stanowisko}` | kalkulator, roadmapa, `cv-{zawód}`, 3 podobne stanowiska | blok „Co dalej” |
| Home | `/resume-creator`, `/salary-calculator`, `/zarobki`, `/assistant` | sekcja narzędzi above/near the fold |
| Stopka | `/o-nas`, `/zarobki`, `/porownanie`, `/blog` | globalnie |
| CTA w artykule | narzędzie pasujące do **tematu** | pole `promo:` we frontmatter zamiast mapowania per kategoria |

## Schema per typ strony

| Typ | Schema |
|---|---|
| Home | Organization (@id, disambiguatingDescription, sameAs, contactPoint) + WebSite (@id, publisher → @id) |
| Narzędzia | WebApplication + Offer (price 0 tam, gdzie prawdziwie darmowe) + BreadcrumbList |
| /pricing | SoftwareApplication + Offer ×3 |
| /zarobki/{stanowisko} | WebPage + Dataset (lub Occupation z estimatedSalary) + BreadcrumbList |
| /raport | Dataset / Report + Article |
| Blog | BlogPosting (author Person, reviewedBy), BreadcrumbList; /blog → Blog (@id) |
| /autor | ProfilePage + Person |
| /o-nas | AboutPage + Organization |

Bez FAQPage (rich results wycofane) i bez HowTo.

## Sitemap — quality gates

- Strony `/zarobki/{stanowisko}` w sitemapie tylko gdy indeksowalne (próba ≥ próg).
- `lastmod` = data ostatniego przeliczenia danych (zarobki) lub zmiany merytorycznej (blog); bez `changefreq`/`priority`.
- Przy > 500 URL rozbić na sitemap index (blog / narzędzia+dane / zarobki).
