# SKINGARD — landing page

Jednostranični premium landing za PPF brend/studio SKINGARD (Beograd). Čist HTML/CSS/JS,
bez build koraka. Animacije: GSAP 3.15 + ScrollTrigger (učitano preko jsDelivr CDN-a, verzija
je pinovana u `index.html`).

## Pokretanje lokalno

Nije neophodan Node, ali za lokalni server (da `fetch`/module putanje rade identično kao na
produkciji) najlakše je:

```bash
npm run dev
```

Otvara se na `http://localhost:5173`. Alternativa bez npm-a: bilo koji statički server
(`python -m http.server`, VS Code "Live Server" ekstenzija, itd.) — sajt je čist statički HTML.

## Struktura fajlova

```
index.html      sve sekcije, SEO meta tagovi, JSON-LD (LocalBusiness/AutoRepair)
css/style.css   design tokeni (boje, tipografija) + stilovi svih sekcija + responsive
js/main.js      GSAP intro animacija, sticky CTA, mobilni meni, before/after slider,
                pricing kalkulator, validacija forme za povratni poziv
```

## Šta MORA da se zameni pre lansiranja (`[PLACEHOLDER]`)

Pretraži projekat po `PLACEHOLDER` (Ctrl+Shift+F) — sve što treba popuniti je obeleženo:

- **Telefon** — `tel:+381PLACEHOLDER` (header, sticky CTA, kontakt sekcija, JSON-LD)
- **Viber / WhatsApp / Instagram** — linkovi u header-u, sticky CTA-u, kontakt sekciji, footeru
  i `js/main.js` (`WHATSAPP_NUMBER` u `initPricingCalculator()`)
- **Adresa studija** — kontakt sekcija + JSON-LD `address` + Google Maps embed (`src` iframe-a)
- **Radno vreme** — kontakt sekcija + JSON-LD `openingHoursSpecification`
- **Cene paketa** — sekcija `#cene` (namerno nisu izmišljeni brojevi — piše `[PLACEHOLDER RSD]`)
- **Uslovi i trajanje garancije** — sekcija `#garancija`
- **Trajanje ugradnje po paketu** — sekcija `#proces`, FAQ
- **Recenzije** — sekcija `#recenzije` sadrži demo tekstove za layout, zameniti stvarnim
  recenzijama sa Google/Instagram
- **Fotografije/video** — svi `.img-placeholder` blokovi i `.ba-img` (before/after slajderi u
  portfoliju) su namerno CSS placeholderi dok ne dobijemo prave fotografije/video sekvencu
- **Webhook za lead formu** — `WEBHOOK_URL` u `submitCallbackRequest()` (`js/main.js`).
  Trenutno forma radi front-end validaciju i samo loguje lead u konzolu.

## Boje / brend

Tokeni su u `css/style.css` na vrhu (`:root`):

```css
--skg-black: #0A0A0B;
--skg-magenta: #E6007E;   /* TODO: potvrditi tačan HEX pipetom sa fotografije ambalaže */
--skg-magenta-2: #FF4FB8;
--skg-white: #FFFFFF;
--skg-silver: #C9CACC;
```

`--skg-magenta` je postavljen na uobičajen "brand magenta" ton kao polazna tačka — kada budu
dostupne fotografije ambalaže, dovoljno je izmeniti ovu jednu vrednost (i gradient u
`--skg-gradient`) da se cela stranica ažurira, jer su svi akcenti vezani za promenljive.

## Intro scroll animacija (hero)

`#hero` sekcija je "pinovana" pomoću `position: sticky` (nema potrebe za `ScrollTrigger`
`pin: true`, jednostavnije i bez layout skokova). `js/main.js` → `initIntroAnimation()` vuče
GSAP timeline kroz 4 faze: hero tekst → nailazak folije na haubu (SVG + `clip-path`) → zavlačenje
u uglove (4 "wrap-flap" linije) → blackout → SKINGARD logo.

Trenutna vizuelizacija haube je SVG placeholder (gradient + linije), ne prava fotografija/video.
Kada budu dostupni pravi kadrovi ugradnje, dve opcije:

1. **Image sequence** — zameniti `.hood-svg` sa `<canvas>`/`<img>` sekvencom kadrova i menjati
   `currentFrame` unutar istog `scrub: 0.4` ScrollTrigger-a (najbliže "cinematic" efektu iz brief-a).
2. **Video sa `currentTime` scrub-om** — postaviti `<video>` i sinhronizovati `video.currentTime`
   sa progresom ScrollTrigger-a.

Oba pristupa se uključuju bez menjanja ostatka sajta — samo `.film-visual` blok u `index.html`
i odgovarajući deo `initIntroAnimation()`.

`prefers-reduced-motion: reduce` je poštovan (CSS sakriva animisane slojeve i prikazuje statičan
hero, JS ne pokreće GSAP timeline). Na užim ekranima (`max-width: 640px`) scroll-distanca intro
sekcije je kraća (260vh naspram 380vh) i "sheen" pass preko folije se isključuje na uređajima sa
`navigator.hardwareConcurrency <= 4` radi održavanja 60fps.

## SEO

- Meta title/description/OG tagovi na srpskom u `<head>`
- JSON-LD `AutoRepair` (podtip `LocalBusiness`) sa placeholder adresom/telefonom/radnim vremenom
- Semantička struktura (`header/main/section/footer`, `<table>` za poređenje, `<details>` za FAQ)

## Poznata ograničenja / sledeći korak

- Forma za povratni poziv nema pravi backend — pogledati `submitCallbackRequest()` u `js/main.js`.
- Google Maps iframe koristi generički upit "Novi Beograd" dok ne dobijemo tačnu adresu.
- Sve slike/video su CSS placeholderi — nema fabrikovanih "stock" fotografija automobila.
