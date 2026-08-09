/**
 * SKINGARD — landing interactions
 * 1) GSAP/ScrollTrigger intro sequence (hood wrap animation -> logo reveal)
 * 2) Header / sticky CTA chrome (visible from page load, independent of intro)
 * 3) Mobile nav, reveal-on-scroll, before/after slider,
 *    pricing chips, callback form validation
 *
 * Respects prefers-reduced-motion and falls back gracefully if GSAP
 * failed to load (e.g. offline dev) or on lower-powered devices.
 */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isLowPower = window.matchMedia("(max-width: 640px)").matches &&
    (navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false);
  var gsapAvailable = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  document.addEventListener("DOMContentLoaded", function () {
    // Header / sticky CTA are shown from the very first frame — the GSAP
    // hood-sequence intro below is a purely visual scroll sequence, it no
    // longer gates navigation. Otherwise, on a ~460vh intro, visitors have
    // to scroll ~4-5 screens before the nav (incl. cross-page links like
    // "Obojeni PPF") even exists in the DOM's visible/interactive state.
    toggleChrome(true);

    initFooterYear();
    initMobileNav();
    initRevealOnScroll();
    initBeforeAfterSliders();
    initVideoBlocks();
    initPricingCalculator();
    initColorPaletteFilter();
    initPaletteLightbox();
    initCallbackForm();
    initWholesaleForm();
    initStickyCtaOverlapGuard();
    initConversionTracking();
    initCookieConsent();

    // On weaker/low-power mobile devices we skip the scrubbed GSAP intro
    // entirely and fall back to the same static CSS state used for
    // prefers-reduced-motion (see .no-intro-anim rules in style.css) —
    // a real "CSS-only" fallback, not just a lighter animation.
    if (gsapAvailable && !prefersReducedMotion && !isLowPower) {
      initIntroAnimation();
    } else {
      document.documentElement.classList.add("no-intro-anim");
      toggleChrome(true);
    }

    initHashScrollFix();
  });

  /* ---------------------------------------------------------
     Cross-page anchor links (e.g. "index.html#garancija" from
     garantni-uslovi.html) land on the wrong spot: the browser
     jumps to the #hash target against the pre-JS layout, then
     GSAP ScrollTrigger pins the intro section and inserts a huge
     spacer (280-380% of viewport height) above everything else,
     shifting the real target far down the page. We re-run the
     jump-to-anchor after that pin (and any late image/font
     layout) has settled, forcing an instant (non-smooth) scroll
     so it still feels like a normal anchor landing.
  --------------------------------------------------------- */
  function initHashScrollFix() {
    if (!window.location.hash) return;

    var target;
    try {
      target = document.querySelector(window.location.hash);
    } catch (e) {
      return;
    }
    if (!target) return;

    function jumpToTarget() {
      var root = document.documentElement;
      var prevBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start" });
      root.style.scrollBehavior = prevBehavior;
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(jumpToTarget);
    });

    window.addEventListener("load", function () {
      setTimeout(jumpToTarget, 60);
    });
  }

  /* ---------------------------------------------------------
     Header + sticky CTA chrome (shown once intro is done)
  --------------------------------------------------------- */
  function toggleChrome(visible) {
    var header = document.querySelector(".site-header");
    var stickyCta = document.querySelector("[data-sticky-cta]");
    if (header) header.classList.toggle("is-active", visible);
    if (stickyCta) stickyCta.classList.toggle("is-visible", visible);
  }

  /* ---------------------------------------------------------
     Intro scroll animation (GSAP + ScrollTrigger)

     The hood-corner sequence is real footage of a SKINGARD install
     (assets/hood-sequence/frame-001..100.webp, extracted @10fps from a
     10s clip), scrubbed frame-by-frame against scroll progress via
     <canvas> — the same "image sequence" technique used for product-
     reveal scroll sites. Frames are preloaded eagerly (unlike the
     below-the-fold portfolio images) because this sequence is the
     first thing the user scrolls into, right after the hero copy.
  --------------------------------------------------------- */
  var FRAME_COUNT = 100;
  var FRAME_PATH = function (i) {
    return "assets/hood-sequence/frame-" + String(i + 1).padStart(3, "0") + ".webp";
  };

  function initIntroAnimation() {
    var introWrap = document.querySelector(".intro-pin-wrap");
    var canvas = document.querySelector("[data-film-canvas]");
    if (!introWrap || !canvas) return;

    var heroCopy = document.querySelector('[data-intro-layer="hero"]');
    var filmVisual = document.querySelector('[data-intro-layer="visual"]');
    var blackout = document.querySelector('[data-intro-layer="blackout"]');
    var logo = document.querySelector('[data-intro-layer="logo"]');
    var visualCaption = document.querySelector(".visual-caption");
    var ctx = canvas.getContext("2d");

    var frames = [];
    var framesLoaded = [];
    var currentFrame = 0;

    function sizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }

    function nearestLoadedFrame(idx) {
      for (var i = Math.max(0, Math.min(idx, FRAME_COUNT - 1)); i >= 0; i--) {
        if (framesLoaded[i]) return i;
      }
      return -1;
    }

    function drawFrame(idx) {
      currentFrame = idx;
      var found = nearestLoadedFrame(Math.round(idx));
      if (found === -1 || !canvas.width) return;
      ctx.drawImage(frames[found], 0, 0, canvas.width, canvas.height);
    }

    function preloadFrames() {
      for (var i = 0; i < FRAME_COUNT; i++) {
        var img = new Image();
        img.decoding = "async";
        if (i === 0 && "fetchPriority" in img) img.fetchPriority = "high";
        img.onload = (function (idx) {
          return function () {
            framesLoaded[idx] = true;
            if (idx === 0) drawFrame(0);
          };
        })(i);
        img.src = FRAME_PATH(i);
        frames.push(img);
      }
    }

    sizeCanvas();
    preloadFrames();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        sizeCanvas();
        drawFrame(currentFrame);
      }, 150);
    });

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(filmVisual, { opacity: 0 });
    gsap.set(blackout, { opacity: 0 });
    gsap.set(logo, { opacity: 0, scale: 0.92 });
    gsap.set(visualCaption, { opacity: 0 });

    var frameProxy = { i: 0 };

    var isNarrow = window.matchMedia("(max-width: 720px)").matches;
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: introWrap,
        start: "top top",
        // Pin the stage and scrub through the hood sequence → brand card.
        // Mobile gets a shorter distance so the sequence doesn't feel endless.
        end: isNarrow ? "+=280%" : "+=380%",
        scrub: 0.4,
        pin: true,
        anticipatePin: 1,
      },
    });

    tl.to(heroCopy, { opacity: 0, y: -40, duration: 1 }, 0)
      .to(filmVisual, { opacity: 1, duration: 0.6 }, 0.55)
      .to(visualCaption, { opacity: 1, duration: 0.4 }, 0.9)
      .to(frameProxy, {
        i: FRAME_COUNT - 1,
        duration: 3.1,
        onUpdate: function () { drawFrame(frameProxy.i); },
      }, 0.9)
      .to(filmVisual, { opacity: 0, duration: 0.5 }, 4.0)
      .to(blackout, { opacity: 1, duration: 0.6 }, 3.75)
      .fromTo(logo, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }, 4.5)
      .to(logo, { opacity: 1, duration: 0.6 }, 5.3)
      // Hold: logo sits alone on a fully black screen from ~5.9 to 6.6 (no
      // tweens run here) before it dissolves back to black — the "brand
      // title card" beat — and only once the screen is black again does the
      // pin release and the next section (trust bar) scroll into view.
      .to(logo, { opacity: 0, duration: 0.5 }, 6.6)
      .to(blackout, { opacity: 0, duration: 0.6 }, 6.7);
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  function initMobileNav() {
    var burger = document.querySelector(".burger");
    var nav = document.getElementById("mobile-nav");
    if (!burger || !nav) return;

    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     Reveal-on-scroll for [data-reveal] sections
  --------------------------------------------------------- */
  function initRevealOnScroll() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    function reveal(entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }

    function makeObserver(threshold) {
      return new IntersectionObserver(reveal, { threshold: threshold, rootMargin: "0px 0px -60px 0px" });
    }

    // A section taller than the viewport can never reach a 12% intersection
    // ratio (12% of the ~200-swatch colour palette is several screens), so it
    // would stay at opacity 0 forever. Those reveal as soon as their top edge
    // scrolls in instead.
    var standard = makeObserver(0.12);
    var tall = makeObserver(0);
    items.forEach(function (el) {
      (el.offsetHeight > window.innerHeight ? tall : standard).observe(el);
    });
  }

  /* ---------------------------------------------------------
     Before / after sliders (portfolio)
  --------------------------------------------------------- */
  function initBeforeAfterSliders() {
    document.querySelectorAll("[data-ba-slider]").forEach(function (slider) {
      var range = slider.querySelector(".ba-range");
      var after = slider.querySelector(".ba-img--after");
      if (!range || !after) return;

      function update() {
        var val = range.value + "%";
        after.style.clipPath = "inset(0 " + (100 - range.value) + "% 0 0)";
        slider.style.setProperty("--ba-pos", val);
      }

      range.addEventListener("input", update);
      update();
    });
  }

  /* ---------------------------------------------------------
     Video proof cards (portfolio replacement)
     - Lazy-loads the real <source>/poster only once a card first
       enters the viewport (data-src / data-poster placeholders
       until then, so nothing is fetched below the fold).
     - Autoplays (muted) while a card is on screen, pauses when it
       scrolls out — saves bandwidth and matches "no sound without
       user action" requirement.
     - Visible play/pause button covers browsers that block autoplay
       and gives keyboard/screen-reader users explicit control.
  --------------------------------------------------------- */
  function initVideoBlocks() {
    var frames = document.querySelectorAll("[data-video-frame]");
    if (!frames.length) return;

    var lightbox = document.querySelector("[data-video-lightbox]");
    var lightboxVideo = lightbox ? lightbox.querySelector("[data-video-lightbox-el]") : null;
    var lightboxCaption = lightbox ? lightbox.querySelector("[data-video-lightbox-caption]") : null;
    var lightboxState = { thumbVideo: null, wasPlaying: false, trigger: null };

    function openLightbox(frame, video, trigger) {
      if (!lightbox || !lightboxVideo) return;
      var source = video.querySelector("source[data-src]");
      var src = source ? source.getAttribute("data-src") : null;
      if (!src) return;
      var poster = video.getAttribute("data-poster");
      var captionEl = frame.parentElement ? frame.parentElement.querySelector(".video-caption") : null;

      lightboxState.thumbVideo = video;
      lightboxState.wasPlaying = !video.paused;
      lightboxState.trigger = trigger || null;
      video.pause();

      lightboxVideo.src = src;
      if (poster) lightboxVideo.setAttribute("poster", poster);
      lightboxVideo.muted = false;
      lightboxVideo.currentTime = 0;
      if (lightboxCaption) lightboxCaption.textContent = captionEl ? captionEl.textContent : "";

      lightbox.hidden = false;
      document.body.classList.add("video-lightbox-open");
      requestAnimationFrame(function () { lightbox.classList.add("is-open"); });

      lightboxVideo.play().catch(function () {});

      var closeBtn = lightbox.querySelector(".video-lightbox-close");
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (!lightbox || lightbox.hidden) return;
      lightbox.classList.remove("is-open");
      document.body.classList.remove("video-lightbox-open");
      lightboxVideo.pause();
      lightboxVideo.removeAttribute("src");
      lightboxVideo.load();
      lightbox.hidden = true;

      if (lightboxState.thumbVideo && lightboxState.wasPlaying) {
        lightboxState.thumbVideo.play().catch(function () {});
      }
      if (lightboxState.trigger) lightboxState.trigger.focus();
      lightboxState.thumbVideo = null;
      lightboxState.trigger = null;
    }

    if (lightbox) {
      lightbox.querySelectorAll("[data-video-lightbox-close]").forEach(function (el) {
        el.addEventListener("click", closeLightbox);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
      });
    }

    frames.forEach(function (frame) {
      var video = frame.querySelector("video");
      var toggleBtn = frame.querySelector("[data-video-toggle]");
      var expandBtn = frame.querySelector("[data-video-expand]");
      var playIcon = frame.querySelector(".icon-play");
      var pauseIcon = frame.querySelector(".icon-pause");
      if (!video) return;

      var loaded = false;
      var userPaused = false;

      function loadSource() {
        if (loaded) return;
        loaded = true;
        var source = video.querySelector("source[data-src]");
        if (source) source.src = source.getAttribute("data-src");
        var poster = video.getAttribute("data-poster");
        if (poster) video.setAttribute("poster", poster);
        video.preload = "metadata";
        video.load();
      }

      function updateIcons() {
        var playing = !video.paused && !video.ended;
        if (playIcon) playIcon.hidden = playing;
        if (pauseIcon) pauseIcon.hidden = !playing;
        if (toggleBtn) toggleBtn.setAttribute("aria-label", playing ? "Pauziraj video" : "Pokreni video");
      }

      video.addEventListener("play", updateIcons);
      video.addEventListener("pause", updateIcons);
      updateIcons();

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          loadSource();
          if (video.paused) {
            userPaused = false;
            video.play().catch(function () {});
          } else {
            userPaused = true;
            video.pause();
          }
        });
      }

      video.addEventListener("click", function () {
        openLightbox(frame, video, expandBtn || toggleBtn);
      });
      if (expandBtn) {
        expandBtn.addEventListener("click", function () {
          openLightbox(frame, video, expandBtn);
        });
      }

      if (!("IntersectionObserver" in window)) {
        // No IO support: load eagerly, skip autoplay-on-scroll behavior.
        loadSource();
        return;
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              loadSource();
              if (!userPaused) video.play().catch(function () {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(frame);
    });
  }

  /* ---------------------------------------------------------
     Pricing "calculator" chips -> starting price + WhatsApp inquiry
     link. PRICE_MATRIX below holds the real "od" (starting) price per
     vehicle class × package, in EUR. The scope text under the price is
     pulled live from the matching .price-card in the pricing grid
     above, so it never drifts out of sync with the package
     descriptions already on the page.
  --------------------------------------------------------- */
  var PRICE_MATRIX = {
    "series-c": {
      "Malo/kompaktno vozilo": {
        "Prednji paket": { min: "800€" },
        "Full Body": { min: "2.500€" },
        "Color change": { min: "2.800€" }
      },
      "Srednje vozilo (sedan/SUV)": {
        "Prednji paket": { min: "850€" },
        "Full Body": { min: "2.700€" },
        "Color change": { min: "3.000€" }
      },
      "Veliko/premium vozilo": {
        "Prednji paket": { min: "900€" },
        "Full Body": { min: "3.000€" },
        "Color change": { min: "3.200€" }
      }
    },
    "color-ppf": {
      "Malo/kompaktno vozilo": {
        "Full Body": { min: "3.200€" }
      },
      "Srednje vozilo (sedan/SUV)": {
        "Full Body": { min: "3.500€" }
      },
      "Veliko/premium vozilo": {
        "Full Body": { min: "3.800€" }
      }
    }
  };

  function findPackageScope(pkgName) {
    var cards = document.querySelectorAll(".price-card");
    for (var i = 0; i < cards.length; i++) {
      var heading = cards[i].querySelector("h3");
      if (heading && heading.textContent.trim() === pkgName) {
        var desc = cards[i].querySelector(".price-desc");
        return desc ? desc.textContent.trim() : "";
      }
    }
    return "";
  }

  function initPricingCalculator() {
    var WHATSAPP_NUMBER = "381653704426";

    var calcBox = document.querySelector(".calc-box");
    var classButtons = document.querySelectorAll("[data-calc-class]");
    var packageButtons = document.querySelectorAll("[data-calc-package]");
    var resultBox = document.querySelector("[data-calc-result]");
    var titleEl = document.querySelector("[data-calc-title]");
    var priceMinEl = document.querySelector("[data-calc-price-min]");
    var scopeEl = document.querySelector("[data-calc-scope]");
    var ctaEl = document.querySelector("[data-calc-cta]");

    if (!classButtons.length || !packageButtons.length || !resultBox) return;

    var product = calcBox ? calcBox.getAttribute("data-calc-product") : null;
    var state = { vehicleClass: null, pkg: null };

    var preselectedClass = document.querySelector("[data-calc-class].is-active");
    var preselectedPkg = document.querySelector("[data-calc-package].is-active");
    if (preselectedClass) state.vehicleClass = preselectedClass.getAttribute("data-calc-class");
    if (preselectedPkg) state.pkg = preselectedPkg.getAttribute("data-calc-package");

    classButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        classButtons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.vehicleClass = btn.getAttribute("data-calc-class");
        render();
      });
    });

    packageButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        packageButtons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.pkg = btn.getAttribute("data-calc-package");
        render();
      });
    });

    function render() {
      if (!state.vehicleClass || !state.pkg) return;

      var range = product && PRICE_MATRIX[product] && PRICE_MATRIX[product][state.vehicleClass]
        ? PRICE_MATRIX[product][state.vehicleClass][state.pkg]
        : null;

      if (titleEl) titleEl.textContent = state.pkg + " — " + state.vehicleClass;
      if (priceMinEl) priceMinEl.textContent = range ? range.min : "—";
      if (scopeEl) scopeEl.textContent = findPackageScope(state.pkg);

      resultBox.hidden = false;

      var message = "Zdravo, zanima me SKINGARD paket \u201c" + state.pkg + "\u201d za vozilo klase \u201c" + state.vehicleClass + "\u201d. Molim vas okvirnu cenu i slobodne termine.";
      if (ctaEl) ctaEl.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message));

      pushDataLayerEvent({ event: "calc_completed", calc_class: state.vehicleClass, calc_package: state.pkg });
    }
  }

  /* ---------------------------------------------------------
     Color palette category filter (SKINGARD COLOR PPF page).
     Each chip shows its category; by default only the first
     PALETTE_PREVIEW_LIMIT cards are visible, with a
     "Prikaži sve" button revealing the rest. No "Sve boje" chip.
  --------------------------------------------------------- */
  var PALETTE_PREVIEW_LIMIT = 8;

  function initColorPaletteFilter() {
    var filterButtons = document.querySelectorAll("[data-palette-filter]");
    var swatches = Array.prototype.slice.call(document.querySelectorAll("[data-palette-item]"));
    var moreWrap = document.querySelector("[data-palette-more]");
    var moreBtn = document.querySelector("[data-palette-more-btn]");
    if (!filterButtons.length || !swatches.length) return;

    function activeCategory() {
      var active = document.querySelector("[data-palette-filter].is-active");
      return active ? active.getAttribute("data-palette-filter") : filterButtons[0].getAttribute("data-palette-filter");
    }

    function applyFilter(category, showAll) {
      var matched = 0;
      swatches.forEach(function (swatch) {
        var isMatch = swatch.getAttribute("data-palette-item") === category;
        if (!isMatch) {
          swatch.hidden = true;
          return;
        }
        matched += 1;
        swatch.hidden = !showAll && matched > PALETTE_PREVIEW_LIMIT;
      });

      if (moreWrap && moreBtn) {
        var remaining = matched - PALETTE_PREVIEW_LIMIT;
        if (!showAll && remaining > 0) {
          moreWrap.hidden = false;
          moreBtn.textContent = "Prikaži sve (" + remaining + ")";
        } else {
          moreWrap.hidden = true;
        }
      }
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterButtons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        applyFilter(btn.getAttribute("data-palette-filter"), false);
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        applyFilter(activeCategory(), true);
      });
    }

    applyFilter(activeCategory(), false);
  }

  /* ---------------------------------------------------------
     Colour-palette image lightbox: click a swatch photo to open
     it fullscreen. Prev/next walk only currently visible cards
     that have a real <img> (placeholders without photos are skipped).
  --------------------------------------------------------- */
  function initPaletteLightbox() {
    var section = document.querySelector(".palette-section");
    var lightbox = document.querySelector("[data-palette-lightbox]");
    if (!section || !lightbox) return;

    var lightboxImg = lightbox.querySelector("[data-palette-lightbox-el]");
    var lightboxCaption = lightbox.querySelector("[data-palette-lightbox-caption]");
    var prevBtn = lightbox.querySelector("[data-palette-lightbox-prev]");
    var nextBtn = lightbox.querySelector("[data-palette-lightbox-next]");
    var cards = Array.prototype.slice.call(section.querySelectorAll("[data-palette-item]"));
    var state = { index: -1, trigger: null };

    function visiblePhotoCards() {
      return cards.filter(function (card) {
        return !card.hidden && card.querySelector("img.video-el");
      });
    }

    function openAt(index, trigger) {
      var list = visiblePhotoCards();
      if (!list.length || index < 0 || index >= list.length) return;

      var card = list[index];
      var img = card.querySelector("img.video-el");
      var caption = card.querySelector(".video-caption");
      state.index = index;
      state.trigger = trigger || img;

      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      if (lightboxCaption) {
        lightboxCaption.textContent = caption ? caption.textContent : (img.alt || "");
      }

      var multi = list.length > 1;
      if (prevBtn) prevBtn.hidden = !multi;
      if (nextBtn) nextBtn.hidden = !multi;

      lightbox.hidden = false;
      document.body.classList.add("video-lightbox-open");
      requestAnimationFrame(function () { lightbox.classList.add("is-open"); });

      var closeBtn = lightbox.querySelector(".video-lightbox-close");
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.classList.remove("is-open");
      document.body.classList.remove("video-lightbox-open");
      lightbox.hidden = true;
      lightboxImg.removeAttribute("src");
      if (state.trigger) state.trigger.focus();
      state.index = -1;
      state.trigger = null;
    }

    function step(delta) {
      var list = visiblePhotoCards();
      if (list.length < 2 || state.index < 0) return;
      openAt((state.index + delta + list.length) % list.length, state.trigger);
    }

    section.addEventListener("click", function (e) {
      var frame = e.target.closest(".video-frame");
      if (!frame || !section.contains(frame)) return;
      var card = frame.closest("[data-palette-item]");
      var img = frame.querySelector("img.video-el");
      if (!card || !img || card.hidden) return;

      var list = visiblePhotoCards();
      var index = list.indexOf(card);
      if (index === -1) return;
      openAt(index, img);
    });

    lightbox.querySelectorAll("[data-palette-lightbox-close]").forEach(function (el) {
      el.addEventListener("click", closeLightbox);
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------------------------------------------------------
     Callback form: front-end validation + optimistic UX.
     Real CRM/Telegram-bot integration hooks into
     submitCallbackRequest() below — swap the fetch() target
     once the webhook URL is available.
  --------------------------------------------------------- */
  function initCallbackForm() {
    var form = document.getElementById("callback-form");
    if (!form) return;

    var nameInput = document.getElementById("cb-name");
    var phoneInput = document.getElementById("cb-phone");
    var statusEl = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector('button[type="submit"]');

    [nameInput, phoneInput].forEach(function (input) {
      input.addEventListener("blur", function () { input.setAttribute("data-touched", "true"); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      nameInput.setAttribute("data-touched", "true");
      phoneInput.setAttribute("data-touched", "true");

      var nameError = form.querySelector('[data-error-for="cb-name"]');
      var phoneError = form.querySelector('[data-error-for="cb-phone"]');
      nameError.textContent = "";
      phoneError.textContent = "";

      var valid = true;

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        nameError.textContent = "Unesite ime (min. 2 slova).";
        valid = false;
      }

      var phoneVal = phoneInput.value.trim();
      var phonePattern = /^[+0-9 ]{6,20}$/;
      if (!phoneVal || !phonePattern.test(phoneVal)) {
        phoneError.textContent = "Unesite ispravan broj telefona.";
        valid = false;
      }

      // Honeypot: bots tend to fill hidden fields.
      var honeypot = form.querySelector(".hp-field");
      if (honeypot && honeypot.value) return;

      if (!valid) {
        statusEl.textContent = "";
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = "Slanje...";

      pushDataLayerEvent({ event: "form_submit", form_id: "callback-form" });

      submitCallbackRequest({ name: nameInput.value.trim(), phone: phoneVal })
        .then(function () {
          statusEl.textContent = "Hvala! Pozivamo vas u najkraćem roku.";
          form.reset();
          nameInput.removeAttribute("data-touched");
          phoneInput.removeAttribute("data-touched");
        })
        .catch(function () {
          statusEl.textContent = "Greška pri slanju. Pozovite nas direktno na +381 65 3704426.";
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ---------------------------------------------------------
     Telegram integracija: šalje lead u Telegram chat preko
     Cloudflare Worker proxy-ja (cloudflare-worker/telegram-proxy.js).
     Bot token i chat_id žive samo na Worker-u kao secrets, nikad
     u ovom fajlu — sajt je frontend-only pa nema drugo mesto koje
     bi ih sakrilo.

     Podešavanje (jednom):
     1) cd cloudflare-worker && wrangler deploy
     2) wrangler secret put TELEGRAM_BOT_TOKEN
     3) wrangler secret put TELEGRAM_CHAT_ID
     4) Upiši dobijeni *.workers.dev URL ispod u TELEGRAM_PROXY_URL.
  --------------------------------------------------------- */
  var TELEGRAM_PROXY_URL = "https://skingard-telegram-proxy.luxurycars78.workers.dev";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function sendTelegramMessage(text) {
    if (!TELEGRAM_PROXY_URL) {
      console.info("[SKINGARD] Telegram proxy nije podešen, lead:\n" + text);
      return Promise.resolve();
    }

    return fetch(TELEGRAM_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    }).then(function (res) {
      if (!res.ok) throw new Error("Telegram proxy error");
      return res.json().catch(function () { return null; });
    });
  }

  function submitCallbackRequest(payload) {
    var text =
      "📞 <b>Novi poziv za pozivanje (sajt)</b>\n" +
      "Ime: " + escapeHtml(payload.name) + "\n" +
      "Telefon: " + escapeHtml(payload.phone);

    return sendTelegramMessage(text);
  }

  /* ---------------------------------------------------------
     B2B veleprodaja lead form (veleprodaja.html): more fields
     than the consumer callback-form, used to qualify the lead
     (studio name, city/territory, expected monthly volume...).
     Real CRM integration hooks into submitWholesaleRequest()
     below, mirroring submitCallbackRequest().
  --------------------------------------------------------- */
  function initWholesaleForm() {
    var form = document.getElementById("wholesale-form");
    if (!form) return;

    var statusEl = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector('button[type="submit"]');

    var requiredFields = [
      { id: "wf-company", label: "naziv studija", minLength: 2 },
      { id: "wf-contact", label: "kontakt osobu", minLength: 2 },
      { id: "wf-city", label: "grad / teritoriju", minLength: 2 },
    ];

    var phoneInput = document.getElementById("wf-phone");
    var emailInput = document.getElementById("wf-email");

    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { input.setAttribute("data-touched", "true"); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var valid = true;

      requiredFields.forEach(function (field) {
        var input = document.getElementById(field.id);
        var errorEl = form.querySelector('[data-error-for="' + field.id + '"]');
        input.setAttribute("data-touched", "true");
        if (errorEl) errorEl.textContent = "";
        if (!input.value.trim() || input.value.trim().length < field.minLength) {
          if (errorEl) errorEl.textContent = "Unesite " + field.label + ".";
          valid = false;
        }
      });

      var phoneError = form.querySelector('[data-error-for="wf-phone"]');
      phoneInput.setAttribute("data-touched", "true");
      if (phoneError) phoneError.textContent = "";
      var phoneVal = phoneInput.value.trim();
      var phonePattern = /^[+0-9 ]{6,20}$/;
      if (!phoneVal || !phonePattern.test(phoneVal)) {
        if (phoneError) phoneError.textContent = "Unesite ispravan broj telefona.";
        valid = false;
      }

      var emailError = form.querySelector('[data-error-for="wf-email"]');
      emailInput.setAttribute("data-touched", "true");
      if (emailError) emailError.textContent = "";
      var emailVal = emailInput.value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailPattern.test(emailVal)) {
        if (emailError) emailError.textContent = "Unesite ispravan email.";
        valid = false;
      }

      // Honeypot: bots tend to fill hidden fields.
      var honeypot = form.querySelector(".hp-field");
      if (honeypot && honeypot.value) return;

      if (!valid) {
        statusEl.textContent = "";
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = "Slanje...";

      pushDataLayerEvent({ event: "form_submit", form_id: "wholesale-form" });

      var preferredChannels = Array.from(form.querySelectorAll('input[name="channel"]:checked')).map(function (cb) {
        return cb.value;
      });

      submitWholesaleRequest({
        company: document.getElementById("wf-company").value.trim(),
        contact: document.getElementById("wf-contact").value.trim(),
        phone: phoneVal,
        email: emailVal,
        city: document.getElementById("wf-city").value.trim(),
        volume: document.getElementById("wf-volume") ? document.getElementById("wf-volume").value.trim() : "",
        channels: preferredChannels,
        message: document.getElementById("wf-message") ? document.getElementById("wf-message").value.trim() : "",
      })
        .then(function () {
          statusEl.textContent = "Hvala! Javljamo se u najkraćem roku sa veleprodajnom ponudom.";
          form.reset();
          form.querySelectorAll("[data-touched]").forEach(function (input) {
            input.removeAttribute("data-touched");
          });
        })
        .catch(function () {
          statusEl.textContent = "Greška pri slanju. Pošaljite upit direktno na +381 65 3704426.";
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  function submitWholesaleRequest(payload) {
    var text =
      "🔧 <b>Novi veleprodajni upit</b>\n" +
      "Studio: " + escapeHtml(payload.company) + "\n" +
      "Kontakt osoba: " + escapeHtml(payload.contact) + "\n" +
      "Telefon: " + escapeHtml(payload.phone) + "\n" +
      (payload.email ? "Email: " + escapeHtml(payload.email) + "\n" : "") +
      "Grad: " + escapeHtml(payload.city) + "\n" +
      (payload.volume ? "Očekivane količine: " + escapeHtml(payload.volume) + "\n" : "") +
      (payload.channels && payload.channels.length ? "Preferirani kontakt: " + escapeHtml(payload.channels.join(", ")) + "\n" : "") +
      (payload.message ? "Poruka: " + escapeHtml(payload.message) : "");

    return sendTelegramMessage(text.trim());
  }

  /* ---------------------------------------------------------
     Sticky CTA overlap guard.

     The floating sticky-cta widget (call/Viber/WhatsApp/"Zakaži termin")
     is fixed-position, so on some viewports it visually sits on top of a
     section's own CTA (micro-cta / hero CTA row / calc-result / form
     submit buttons / path-switcher). An IntersectionObserver rootMargin
     band can't model this correctly across breakpoints — the widget is
     vertically centered on desktop but bottom-anchored on mobile, so a
     symmetric top/bottom exclusion band misses CTAs that appear right at
     the bottom edge (exactly where the mobile bar lives). Instead we
     directly compare bounding rects on scroll/resize (rAF-throttled).
  --------------------------------------------------------- */
  function initStickyCtaOverlapGuard() {
    var sticky = document.querySelector("[data-sticky-cta]");
    if (!sticky) return;

    var ctaTargets = document.querySelectorAll(
      ".micro-cta, .hero-cta-row, .btn-block, .path-switcher-inner"
    );
    if (!ctaTargets.length) return;

    var ticking = false;

    function rectsOverlap(a, b) {
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    function check() {
      ticking = false;
      var stickyRect = sticky.getBoundingClientRect();
      if (stickyRect.width === 0 || stickyRect.height === 0) return;

      var overlapping = false;
      for (var i = 0; i < ctaTargets.length; i++) {
        var r = ctaTargets[i].getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue; // off-screen, skip
        if (rectsOverlap(r, stickyRect)) {
          overlapping = true;
          break;
        }
      }
      sticky.classList.toggle("is-yielding", overlapping);
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    check();
  }

  /* ---------------------------------------------------------
     GTM / dataLayer conversion event tracking.

     Pushes fire regardless of whether a real GTM container ID is
     configured (see the <head> snippet) — without one they're inert,
     but the wiring is ready so switching on paid-ads analytics later
     needs no further dev work, just dropping in the container ID.
  --------------------------------------------------------- */
  function pushDataLayerEvent(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  function initConversionTracking() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("a[href]") : null;
      if (!link) return;
      var href = link.getAttribute("href") || "";

      if (href.indexOf("wa.me/") !== -1 || href.indexOf("api.whatsapp.com") !== -1) {
        pushDataLayerEvent({ event: "whatsapp_click", link_url: href });
      } else if (href.indexOf("viber://") === 0) {
        pushDataLayerEvent({ event: "viber_click", link_url: href });
      } else if (href.indexOf("tel:") === 0) {
        pushDataLayerEvent({ event: "phone_click", link_url: href });
      }
    });
  }

  /* ---------------------------------------------------------
     Cookie consent banner + Google Consent Mode v2.

     Gate is real, not cosmetic: the <head> of every page reads this same
     localStorage key SYNCHRONOUSLY (before dataLayer even exists) and
     seeds gtag('consent','default', ...) with "granted"/"denied"
     accordingly, before the GTM snippet loads — so returning visitors get
     the right state from the very first tag fire instead of waiting on
     this deferred script. This function only handles the interactive
     side: showing the banner on first visit and sending
     gtag('consent','update', ...) the moment the visitor actually makes
     a choice, then persisting it to localStorage for next time.
  --------------------------------------------------------- */
  function initCookieConsent() {
    var STORAGE_KEY = "skingard_cookie_consent"; // 'granted' | 'denied'
    var banner = document.getElementById("cookieBanner");
    var modal = document.getElementById("cookieModal");
    if (!banner) return;

    var analyticsCheckbox = document.getElementById("cookieAnalytics");
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage unavailable (e.g. private mode edge cases) — banner
      // will simply show again next visit instead of throwing.
    }

    function applyConsent(status, persist) {
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      var value = status === "granted" ? "granted" : "denied";
      gtag("consent", "update", {
        analytics_storage: value,
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
      });
      if (persist !== false) {
        try {
          localStorage.setItem(STORAGE_KEY, status);
        } catch (e) {}
      }
    }

    function hideBanner() {
      banner.style.display = "none";
    }

    function showBanner() {
      banner.style.display = "flex";
    }

    function openModal() {
      if (!modal) return;
      if (analyticsCheckbox) analyticsCheckbox.checked = saved !== "denied";
      modal.hidden = false;
    }

    function closeModal() {
      if (modal) modal.hidden = true;
    }

    if (saved === "granted" || saved === "denied") {
      // Reassert the stored choice as an explicit consent update on every
      // page load (not just a hidden banner) — the <head> default already
      // seeds the right state before GTM loads, but this is a belt-and-
      // braces re-send per Google's guidance so tags never end up stuck
      // on "denied" if a page's inline default block is ever missed.
      applyConsent(saved, false);
      hideBanner();
    } else {
      showBanner();
    }

    var acceptBtn = document.getElementById("cookieAccept");
    var declineBtn = document.getElementById("cookieDecline");
    var settingsBtn = document.getElementById("cookieSettings");
    var modalCloseBtn = document.getElementById("cookieModalClose");
    var modalSaveBtn = document.getElementById("cookieModalSave");

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        saved = "granted";
        applyConsent("granted");
        hideBanner();
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener("click", function () {
        saved = "denied";
        applyConsent("denied");
        hideBanner();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", openModal);
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeModal);
    }

    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.hidden) closeModal();
      });
    }

    if (modalSaveBtn) {
      modalSaveBtn.addEventListener("click", function () {
        var analyticsOn = analyticsCheckbox ? analyticsCheckbox.checked : false;
        saved = analyticsOn ? "granted" : "denied";
        applyConsent(saved);
        closeModal();
        hideBanner();
      });
    }
  }

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
