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
index.html                 sve sekcije, SEO meta tagovi, JSON-LD (LocalBusiness/AutoRepair)
css/style.css               design tokeni (boje, tipografija) + stilovi svih sekcija + responsive
js/main.js                  GSAP intro animacija, sticky CTA, mobilni meni, before/after slider,
                             pricing kalkulator, validacija forme za povratni poziv
assets/hood-sequence/       100 .webp kadrova prave ugradnje za hero intro (vidi ispod)
assets/brand/               originalni logo fajlovi (wordmark + pattern), izvor boja/og:image
robots.txt, sitemap.xml     osnovni SEO fajlovi (placeholder domen skingard.rs)
films.json                  katalog TPU folija (sku, naziv, kategorija, izvorni URL fotografije)
js/films-data.js            isti katalog kao films.json, samo kao `window.FILMS_DATA` (trenutno
                             nije učitan ni na jednoj stranici — mrtav kod, drži se u sync-u sa
                             films.json za slučaj da zatreba runtime pristup podacima)
download-films.js           `npm run films` — skida fotografije uzoraka (po `sourceUrl`)
build-palette.js            `npm run palette` — generiše sekciju #paleta na folija-u-boji.html iz films.json
```

### Paleta boja (`#paleta` na `folija-u-boji.html`)

Čipovi filtera i kartice uzoraka se **ne uređuju ručno** — generišu se iz `films.json`:

```bash
npm run films      # skida fotografije po sourceUrl-u (preskače stavke bez njega/postojeće fajlove)
npm run palette    # upisuje markup između `palette-chips:`/`palette-cards:` markera
```

Kartice se peku u HTML, a ne dovlače fetch-om, jer `initColorPaletteFilter()` u `js/main.js`
čita `[data-palette-item]` samo jednom na `DOMContentLoaded` — sve ubačeno posle toga bi bilo
nevidljivo i za filter i za pretraživače. Mapiranje kategorija (`Glossy` → `Standardne boje`
itd.) je na vrhu `build-palette.js`.

**Trenutni katalog (183 TPU uzorka, `T001`–`T183`) nema `sourceUrl`** — to je poseban
proizvod (TPU hameleon/color-shift folije), uzorci potiču iz skeniranog kataloga dobavljača,
ne sa javno dostupnog sajta sa fotografijama. `npm run films` će ih sve preskočiti
(`[skip] ... no photo on source site`). Da bi se slike stvarno prikazale na sajtu:

1. Ubaci prave fotografije uzoraka u `images/tpu-films/`, nazvane tačno kao u `localImage`
   iz `films.json` (npr. `T001.jpg`, `T002.jpg`, ...).
2. Pokreni `npm run palette` opet da markup ostane u sync-u (nije obavezno — putanje se
   ne menjaju, samo se slike pojavljuju kad fajlovi postoje).

Do tada su `<img>` tagovi u `#paleta` sekciji tehnički "bez fotografije" (404) — ovo je
namerno privremeno stanje dok se pravi uzorci ne dostave, isto kao ostali `[PLACEHOLDER]`
delovi sajta.

## Šta MORA da se zameni pre lansiranja (`[PLACEHOLDER]`)

Pretraži projekat po `PLACEHOLDER` (Ctrl+Shift+F) — sve što treba popuniti je obeleženo:

- **Telefon** — popunjeno: `+381 11 4250198` (header, sticky CTA, kontakt sekcija, JSON-LD).
  Isti broj se koristi i za Viber (`viber://chat?number=%2B381653704426`) i WhatsApp
  (`wa.me/381653704426`, `WHATSAPP_NUMBER` u `js/main.js`)
- **Instagram** — popunjeno: `https://www.instagram.com/skingardfilms` (footer, kontakt sekcija, JSON-LD `sameAs`)
- **Adresa studija** — popunjeno: `Ljutice Bogdana 42, Beograd` (kontakt sekcija na sve 3 stranice +
  JSON-LD `address`/`geo` + Google Maps embed i klikabilni link ka Google Maps). Mapa trenutno
  pinuje adresu preko generičkog `?q=` upita — kad SKINGARD studio bude registrovan kao organizacija
  na Google Business/Maps, zameniti taj upit imenom/linkom organizacije (obeleženo `[TODO]` iznad
  `.map-embed` bloka u svakom HTML fajlu) da tačka na mapi prikazuje organizaciju umesto same adrese.
- **Radno vreme** — popunjeno: Pon–Sub 10:00–19:00, poseta samo po prethodnom zakazivanju
  (kontakt sekcija na sve 3 stranice + JSON-LD `openingHoursSpecification`)
- **Cene paketa** — popunjeno u EUR: Prednji paket od 800€ / 850€ / 900€ (malo/srednje/veliko vozilo),
  Full Body (gloss/satin) od 2.500€ / 2.700€ / 3.000€, Color change od 2.800€ / 3.000€ / 3.200€
  (sekcija `#cene` + kalkulator `PRICE_MATRIX` u `js/main.js` + statična cena na `folija-u-boji.html`)
- **Uslovi i trajanje garancije** — sekcija `#garancija`
- **Trajanje ugradnje po paketu** — sekcija `#proces`, FAQ
- **Recenzije** — sekcija je uklonjena (nije postojala nijedna prava recenzija, izmišljeni
  primeri su smatrani rizikom od nedozvoljene reklame). Vratiti je kad budu dostupne stvarne
  recenzije sa Google/Instagram profila studija.
- **Fotografije/video** — hero intro sekvenca (kapot/blatobran, zavlačenje ivice) je **već prava
  snimljena ugradnja** (vidi sekciju ispod). Ono što je i dalje CSS placeholder: svi
  `.img-placeholder` blokovi (problem-sekcija) i `.ba-img` (before/after slajderi u portfoliju) —
  čekaju prave foto/video materijale. Paleta boja (`#paleta`) je popunjena pravim fotografijama
  uzoraka; bez fotografije su ostala samo dva SKU-a (`SD107`, `SD402`) — vidi sekciju o paleti
- **Webhook za lead formu** — `WEBHOOK_URL` u `submitCallbackRequest()` (`js/main.js`).
  Trenutno forma radi front-end validaciju i samo loguje lead u konzolu.

## Boje / brend

Tokeni su u `css/style.css` na vrhu (`:root`):

```css
--skg-black: #0A0A0B;
--skg-magenta: #F188B0;   /* pipetovano sa isporučenog SKINGARD logotipa (wordmark) */
--skg-magenta-2: #FB76A5; /* pipetovano sa isporučene brend grafike (talasaste linije) */
--skg-white: #FFFFFF;
--skg-silver: #B8B8B8;    /* pipetovano sa isporučenog ševron znaka */
```

Boje su tačno pipetovane sa `assets/brand/skingard-logo.png` i `skingard-logo-pattern.png`
(isporučeni logo fajlovi), ne izmišljene. Pošto je brend magenta svetlija/pastelnija nego
prvobitna pretpostavka, `.btn-primary`, `.chip.is-active` i `.price-badge` koriste **tamni**
tekst (`--skg-black`) preko gradient pozadine radi kontrasta — beo tekst na ovoj svetlijoj
roze bi imao slab kontrast.

Logotip (ševron + "SKINGARD" wordmark) se koristi na 3 mesta u `index.html` (header, intro
reveal, footer) kao inline SVG + stilizovan tekst, ne kao rasterizovana slika — ševron je sada
siv (`#B8B8B8`), wordmark roze (`var(--skg-magenta)`) sa blagim italic/skew stilom
(`.brand-word`, `.intro-wordmark`, `.footer-brand span` u `style.css`), po uzoru na isporučeni
logo. Originalni fajlovi logotipa su sačuvani u `assets/brand/` za dalju upotrebu (npr. brend
knjiga, štampa) i `og:image`/JSON-LD sada pokazuju na `assets/brand/skingard-logo-pattern.png`.

## Intro scroll animacija (hero)

`#hero` sekcija je "pinovana" pomoću `position: sticky` (nema potrebe za `ScrollTrigger`
`pin: true`, jednostavnije i bez layout skokova). `js/main.js` → `initIntroAnimation()` vuče
GSAP timeline kroz 4 faze: hero tekst → **prava image-sequence snimka ugradnje** (zavlačenje
folije pod ivicu haube/blatobrana, pa otvaranje haube i pokazivanje čiste ivice) → blackout →
SKINGARD logo.

Sekvenca je prava snimljena ugradnja: `assets/hood-sequence/frame-001.webp` … `frame-100.webp`
(100 kadrova, izvučeno ffmpeg-om iz 10-sekundnog klipa na 10 fps, širina 440px, `.webp`,
ukupno ~2.2 MB). Kadrovi se preload-uju eagerno (ne lenjo, za razliku od portfolio slika ispod
"fold"-a) jer je ovo prva stvar u koju korisnik skroluje. `initIntroAnimation()` crta trenutni
kadar na `<canvas>` preko `drawFrame()`, indeks kadra je tween-ovan GSAP-om (`frameProxy.i`)
sinhrono sa scroll progresom (`scrub: 0.4`). Ako korisnik skroluje brže nego što se kadrovi
stignu učitati, `nearestLoadedFrame()` prikazuje poslednji učitani kadar umesto praznog/pokvarenog
frejma.

Za `prefers-reduced-motion` i `.no-intro-anim` (slabiji mobilni) canvas se uopšte ne inicijalizuje
— umesto njega prikazuje se statičan `<img data-film-poster>` (jedan kadar, `frame-070.webp`),
tako da fallback i dalje ima vizuelni sadržaj, ne samo prazan tekst.

Ako se snimi novi/bolji materijal (npr. dva ugla, ili duži klip), zameniti fajlove u
`assets/hood-sequence/` i po potrebi promeniti `FRAME_COUNT` u `js/main.js` — ostatak logike
(preload, scrub, fallback) ne treba dirati.

### "Title card" pauza pre otkrivanja sadržaja

Posle sekvence, `blackout` sloj postane potpuno crn i `logo` se pojavi i **miruje** (nema tween-a)
dok se scroll ne pomeri dalje — tek onda se logo i blackout postepeno gase, otkrivajući čist crn
ekran, i istog trenutka se `intro-pin-wrap` "otkva\u010di" (unpin) pa sledeća sekcija (trust-bar)
uđe u prikaz. Efekat: skroluj → animacija → **crn ekran sa logom koji miruje** → gašenje → sadržaj,
umesto da se logo naglo "izvuče" sa ekrana zajedno sa unpin-ovanjem. Ukupno trajanje `intro-pin-wrap`
(`460vh` desktop / `320vh` mobilni) je povećano da bi ova pauza imala prostora bez da se skrati
sama sekvenca oklejanja.

`prefers-reduced-motion: reduce` je poštovan (CSS sakriva animisane slojeve i prikazuje statičan
hero, JS ne pokreće GSAP timeline). Na užim ekranima (`max-width: 640px`) uz
`navigator.hardwareConcurrency <= 4` (heuristika za slabiji uređaj) GSAP timeline se **uopšte ne
pokreće** — dodaje se `.no-intro-anim` klasa na `<html>` i sajt pada na isti statičan CSS fallback
kao `prefers-reduced-motion`, umesto samo "lakše" verzije animacije. Scroll-distanca intro sekcije
je i dalje kraća na mobilnom (260vh naspram 380vh) za uređaje koji ipak pokreću animaciju.

## SEO

- Meta title/description/OG tagovi na srpskom u `<head>`
- JSON-LD `AutoRepair` (podtip `LocalBusiness`) sa popunjenom adresom/telefonom/radnim vremenom
- Semantička struktura (`header/main/section/footer`, `<table>` za poređenje, `<details>` za FAQ)
- `robots.txt` i `sitemap.xml` u korenu projekta — koriste `https://www.skingard.rs/` kao placeholder
  domen, isti kao u `<link rel="canonical">` i JSON-LD. Zameniti stvarnim domenom pre lansiranja
  (pretraga po `skingard.rs` pokazuje sva mesta).

## Poznata ograničenja / sledeći korak

- Forma za povratni poziv nema pravi backend — pogledati `submitCallbackRequest()` u `js/main.js`.
- Google Maps iframe koristi upit sa tačnom adresom (`Ljutice Bogdana 42, Beograd`); zameniti
  organizacijom kad bude registrovana na Google Business/Maps.
- Sve slike/video su CSS placeholderi — nema fabrikovanih "stock" fotografija automobila.
