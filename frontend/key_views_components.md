# Kluczowe widoki i komponenty

Poniżej trzy pliki z frontendu, które najciekawiej pokazują logikę aplikacji. Do każdego dodałem fragmenty warte podkreślenia, aby łatwo je wkleić do sekcji „kluczowe widoki i komponenty”.

## `components/ResumeComponents/ResumeComponent.tsx`

- **Autosave z budowaniem payloadu** – komponent składa bieżący stan edytora CV w `autosavePayload`, a następnie używa custom hooka do wysyłania zmian co 60 sekund lub po każdej zmianie danych.

```tsx
const autosavePayload = {
  id: cvId!,
  name: resumeName,
  targetPosition: personalInfo.profession || undefined,
  cvData: buildCvDto(),
};

const { status: autosaveStatus, trigger } = useAutosave({
  value: autosavePayload,
  enabled: canAutosave,
  delay: 60000,
  skipOnce: skipAutosaveOnce,
  onSkipConsumed: () => setSkipAutosaveOnce(false),
});

useEffect(() => {
  if (!canAutosave) return;
  trigger(autosaveFn);
}, [personalInfo, experiences, education, skills, languages, certificates, hobbies, privacyStatement, sectionOrder, resumeName]);
```

- **Eksport PDF bez artefaktów** – przed renderowaniem stron do canvasa komponent tymczasowo wyłącza transformację i obramowania, renderuje każdą stronę w podwyższonej skali, a następnie przywraca styl i zapisuje plik.

```tsx
const origTransform = zoomWrapper.style.transform;
zoomWrapper.style.transform = 'none';
const pagesNodes = container.querySelectorAll<HTMLElement>('.cv-page');
const restoreStyles: Array<{ el: HTMLElement; boxShadow: string; border: string }> = [];
pagesNodes.forEach((el) => {
  restoreStyles.push({ el, boxShadow: el.style.boxShadow || '', border: el.style.border || '' });
  el.style.boxShadow = 'none';
  el.style.border = 'none';
});
...
const canvas = await html2canvas(pageEl, { scale: 1.6, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
const imgData = canvas.toDataURL('image/jpeg', 0.92);
if (i > 0) pdf.addPage();
pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
...
zoomWrapper.style.transform = origTransform;
restoreStyles.forEach(({ el, boxShadow, border }) => {
  el.style.boxShadow = boxShadow;
  el.style.border = border;
});
```

## `lib/hooks/useAutosave.ts`

- **Hook z debounce i anulowaniem** – uniwersalny mechanizm autosave, który porównuje hash danych, anuluje poprzednie requesty przez `AbortController` i zwraca status zapisu. Opcjonalnie może pominąć pierwsze wywołanie (np. po wczytaniu profilu).

```ts
const { status, trigger } = useAutosave({ value, enabled, delay = 3000, skipOnce = false, onSkipConsumed });
...
if (skipOnce) { onSkipConsumed?.(); return; }
const h = getHash(value);
if (h === lastHashRef.current) return;
if (timerRef.current) clearTimeout(timerRef.current);

timerRef.current = setTimeout(async () => {
  abortRef.current?.abort();
  const ac = new AbortController();
  abortRef.current = ac;
  setStatus('saving');
  try {
    await save(value, ac.signal);
    lastHashRef.current = h;
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1200);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return;
    setStatus('error');
  }
}, delay);
```

## `components/AssistantComponents/MainPageAssisstant.tsx`

- **Interaktywna rekomendacja kariery** – ekran ładuje profil z `localStorage`, sprawdza token i próbuje pobrać ostatnie rekomendacje, a gdy ich brak – generuje nowe. Obsługuje błędy (np. brak billing info) i steruje stanem ładowania/CTA.

```tsx
const loadProfileAndRecommendations = async () => {
  setLoading(true);
  setError(null);
  const storedProfile = localStorage.getItem('userProfile');
  if (!storedProfile) { setError('Brak danych profilu. Wróć do formularza.'); setLoading(false); return; }
  const parsedProfile = JSON.parse(storedProfile);
  setProfile(parsedProfile);
  const token = localStorage.getItem('token');
  if (!token) { toast.error('Authentication required', { description: 'Please sign in to continue.' }); setLoading(false); return; }
  try {
    const lastRecommendationResponse = await axios.get<AiCareerResponse>('http://localhost:8080/api/Ai/last-recommendation', { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, });
    setRecommendations(lastRecommendationResponse.data);
    setLoading(false);
    return;
  } catch (lastError: unknown) {
    if (lastError instanceof AxiosError && lastError.response?.status !== 404 && lastError.response?.status !== 500) {
      setError(lastError.response?.data?.detail || 'Something went wrong while getting last recommendations.');
      setLoading(false);
      return;
    }
  }
  const response = await axios.get<AiCareerResponse>('http://localhost:8080/api/Ai/recommendations', { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, });
  setRecommendations(response.data);
};
```

- **Animowane rozwijanie sekcji** – wykorzystuje GSAP do płynnego otwierania i zamykania panelu z dodatkowymi sekcjami rekomendacji, mierząc aktualną wysokość zawartości.

```tsx
if (isCollapsed) {
  gsap.set(contentWrapperRef.current, { height: 'auto', visibility: 'visible' });
  const height = contentWrapperRef.current.offsetHeight;
  gsap.fromTo(contentWrapperRef.current, { height: 0, opacity: 0 }, {
    height,
    opacity: 1,
    duration: 0.5,
    ease: 'power4.out',
    onComplete: () => gsap.set(contentWrapperRef.current, { height: 'auto' }),
  });
} else {
  const height = contentWrapperRef.current.offsetHeight;
  gsap.fromTo(contentWrapperRef.current, { height, opacity: 1 }, {
    height: 0,
    opacity: 0,
    duration: 0.5,
    ease: 'power4.in',
    onComplete: () => gsap.set(contentWrapperRef.current, { visibility: 'hidden' }),
  });
}
```

## `components/SectionsComponents/AboutCards.tsx`

- **Karty „About” z ruchem na scrollu** – na desktopie komponent chwyta wszystkie `.about-card` i dla każdej buduje oś czasu
  GSAP/ScrollTrigger z lekkim offsetem startu (kolejne karty uruchamiają się niżej). Animacja wjeżdża kartę z dołu z fade-in i
  delikatnym przechyleniem, następnie buja ją w pionie i w końcu wyjeżdża w górę, wygaszając przez `autoAlpha`.

```tsx
const cards = containerRef.current.querySelectorAll('.about-card');

cards.forEach((card, index) => {
  const offset = index * 60;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: card,
      start: `top+=${offset} 80%`,
      end: `+=400`,
      scrub: true,
    },
  });

  tl.fromTo(
    card,
    { autoAlpha: 0, y: 100, rotation: 0 },
    {
      autoAlpha: 1,
      y: 0,
      rotation: index % 2 === 0 ? -5 : 5,
      duration: 1,
      ease: 'power2.out',
    }
  )
    .to(card, { y: -40, duration: 1.6, ease: 'sine.inOut' })
    .to(card, { y: 40, duration: 1.6, ease: 'sine.inOut' })
    .to(card, { y: 0, duration: 1.5, ease: 'sine.inOut' })
    .to(card, {
      y: -600,
      autoAlpha: 0,
      rotation: 0,
      duration: 2,
      ease: 'power1.in',
    });
});
```
