/**
 * SKINGARD — landing interactions
 * 1) GSAP/ScrollTrigger intro sequence (hood wrap animation -> logo reveal)
 * 2) Header / sticky CTA visibility after intro
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
    initFooterYear();
    initMobileNav();
    initRevealOnScroll();
    initBeforeAfterSliders();
    initPricingCalculator();
    initCallbackForm();

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
  });

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

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: introWrap,
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
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

    ScrollTrigger.create({
      trigger: introWrap,
      start: "bottom top",
      onEnter: function () { toggleChrome(true); },
      onLeaveBack: function () { toggleChrome(false); },
    });
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

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
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
     Pricing "calculator" chips -> WhatsApp inquiry link
     NOTE: no real prices are fabricated — this only composes
     a pre-filled inquiry message; the studio replies with the
     exact quote. Replace WHATSAPP_NUMBER once known.
  --------------------------------------------------------- */
  function initPricingCalculator() {
    var WHATSAPP_NUMBER = "PLACEHOLDER"; // [PLACEHOLDER] npr. 3816XXXXXXXX (bez '+' i razmaka)

    var classButtons = document.querySelectorAll("[data-calc-class]");
    var packageButtons = document.querySelectorAll("[data-calc-package]");
    var resultBox = document.querySelector("[data-calc-result]");
    var summaryEl = document.querySelector("[data-calc-summary]");
    var ctaEl = document.querySelector("[data-calc-cta]");

    if (!classButtons.length || !packageButtons.length) return;

    var state = { vehicleClass: null, pkg: null };

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
      if (!state.vehicleClass || !state.pkg || !resultBox) return;
      var text = "Auto: " + state.vehicleClass + " · Paket: " + state.pkg;
      summaryEl.textContent = text;
      resultBox.hidden = false;

      var message = "Zdravo, zanima me SKINGARD paket \u201c" + state.pkg + "\u201d za vozilo klase \u201c" + state.vehicleClass + "\u201d. Molim vas okvirnu cenu i slobodne termine.";
      ctaEl.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message));
    }
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

      submitCallbackRequest({ name: nameInput.value.trim(), phone: phoneVal })
        .then(function () {
          statusEl.textContent = "Hvala! Pozivamo vas u najkraćem roku.";
          form.reset();
          nameInput.removeAttribute("data-touched");
          phoneInput.removeAttribute("data-touched");
        })
        .catch(function () {
          statusEl.textContent = "Greška pri slanju. Pozovite nas direktno na [PLACEHOLDER TELEFON].";
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /**
   * [PLACEHOLDER] Integracija sa CRM / Telegram botom.
   * Trenutno nema backend endpoint-a — zameniti WEBHOOK_URL
   * i ukloniti simulirani resolve() kada webhook bude spreman.
   */
  function submitCallbackRequest(payload) {
    var WEBHOOK_URL = ""; // [PLACEHOLDER] npr. https://api.skingard.rs/leads

    if (!WEBHOOK_URL) {
      console.info("[SKINGARD] Callback lead (webhook nije podešen):", payload);
      return Promise.resolve();
    }

    return fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (res) {
      if (!res.ok) throw new Error("Bad response");
      return res.json().catch(function () { return null; });
    });
  }

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
