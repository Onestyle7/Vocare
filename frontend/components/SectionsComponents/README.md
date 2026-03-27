# SectionsComponents

## Floating nav w `Header.tsx`

Logika floating nava jest w pliku `frontend/components/SectionsComponents/Header.tsx`.

Najwazniejsze elementy:

- `FloatingNavVariant` okresla dostepne warianty.
- `floatingNavConfig.enabled` wlacza albo wylacza floating nav.
- `floatingNavConfig.variant` wybiera aktualny wariant zachowania.
- `FLOATING_NAV_TOP_OFFSET` i `FLOATING_NAV_REVEAL_THRESHOLD` steruja momentem pokazania w wariancie scrollowym.

## Szybka konfiguracja

```ts
type FloatingNavVariant = 'default' | 'reveal-on-scroll-up';

const floatingNavConfig = {
  enabled: true,
  variant: 'reveal-on-scroll-up' as FloatingNavVariant,
};
```

## Jak wlaczyc albo wylaczyc

Zmien `enabled` w `floatingNavConfig`:

```ts
const floatingNavConfig = {
  enabled: true,
  variant: 'reveal-on-scroll-up' as FloatingNavVariant,
};
```

`enabled: true` oznacza, ze floating nav moze sie pokazac.

`enabled: false` oznacza, ze floating nav nie bedzie renderowany.

Wazne:

- Floating nav dziala tylko na desktopie.
- Dla mobile jest blokowany przez warunek `!isMobile`.
- `isMobile` jest ustawiane dla `window.innerWidth < 768`.

## Dostepne warianty

### `default`

Ten wariant korzysta z `IntersectionObserver`.

Zachowanie:

- obserwuje glowny `header`,
- pokazuje floating nav, kiedy header przestaje byc widoczny,
- chowa floating nav, kiedy header znowu wchodzi w viewport.

To jest dobry wariant, jesli navbar ma po prostu pojawiac sie po przewinieciu strony w dol.

### `reveal-on-scroll-up`

Ten wariant korzysta z recznej obslugi scrolla.

Zachowanie:

- floating nav nie pokazuje sie od razu po zejsciu headera z ekranu,
- najpierw header musi minac gorny offset `FLOATING_NAV_TOP_OFFSET`,
- potem navbar pojawia sie dopiero wtedy, gdy uzytkownik przewinie strone do gory o co najmniej `FLOATING_NAV_REVEAL_THRESHOLD`,
- przy scrollowaniu w dol navbar chowa sie od razu.

To jest dobry wariant, jesli floating nav ma byc mniej agresywny i pojawiac sie dopiero przy powrocie uzytkownika do gory strony.

## Jak zmienic wariant

Wystarczy zmienic `variant` w `floatingNavConfig`.

Przyklad dla `default`:

```ts
const floatingNavConfig = {
  enabled: true,
  variant: 'default' as FloatingNavVariant,
};
```

Przyklad dla `reveal-on-scroll-up`:

```ts
const floatingNavConfig = {
  enabled: true,
  variant: 'reveal-on-scroll-up' as FloatingNavVariant,
};
```

## Jak dodac nowy wariant

1. Rozszerz typ `FloatingNavVariant`.
2. Dodaj nowa galaz logiki w `useEffect`, tam gdzie teraz rozrozniane sa `default` i `reveal-on-scroll-up`.
3. Jesli nowy wariant potrzebuje progow albo offsetow, dopisz nowe stale obok `FLOATING_NAV_TOP_OFFSET`.
4. Ustaw nowa wartosc w `floatingNavConfig.variant`.

Przyklad:

```ts
type FloatingNavVariant = 'default' | 'reveal-on-scroll-up' | 'custom';

if (floatingNavVariant === 'custom') {
  const handleScroll = () => {
    setShowFloatingNav(window.scrollY > 200);
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => window.removeEventListener('scroll', handleScroll);
}
```

## Jakie linki pokazuje floating nav

To zalezy od stanu logowania:

- zalogowany uzytkownik: `NavLinks` z `frontend/app/constants/index.ts`,
- niezalogowany uzytkownik: lokalne `publicLinks` z `Header.tsx`.

Jesli chcesz zmienic linki:

- dla usera zalogowanego edytuj `NavLinks`,
- dla usera niezalogowanego edytuj `publicLinks` w `Header.tsx`.

## Gdzie zmienic wyglad

Najwazniejsze miejsca w `Header.tsx`:

- kontener floating nava: `motion.div`,
- wrapper paska: element `nav`,
- logo: pierwszy `Link` w pasku,
- linki: lista `floatingLinks.map(...)`.

Jesli zmieniasz tylko styl, nie musisz ruszac logiki w `useEffect`.
