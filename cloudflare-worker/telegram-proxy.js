/**
 * SKINGARD — Telegram lead proxy (Cloudflare Worker).
 *
 * Prima { text } sa sajta (js/main.js) i prosleđuje ga u Telegram preko
 * Bot API. Token i chat_id žive samo ovde kao Worker secrets — nikad se
 * ne šalju u browser, za razliku od direktnog fetch-a sa klijenta.
 *
 * Deploy (jednom, sa Cloudflare nalogom):
 *   npm i -g wrangler
 *   wrangler login
 *   cd cloudflare-worker
 *   wrangler deploy
 *   wrangler secret put TELEGRAM_BOT_TOKEN
 *   wrangler secret put TELEGRAM_CHAT_ID
 *
 * Wrangler nakon deploy-a ispiše URL oblika
 * https://skingard-telegram-proxy.<subdomain>.workers.dev — taj URL
 * upiši u js/main.js kao TELEGRAM_PROXY_URL.
 */

var ALLOWED_ORIGINS = [
  "https://skingard.rs",
  "https://www.skingard.rs",
  "http://localhost:5173",
];

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return withCors(request, new Response(null, { status: 204 }));
    }

    if (request.method !== "POST") {
      return withCors(request, new Response("Method not allowed", { status: 405 }));
    }

    var body;
    try {
      body = await request.json();
    } catch (e) {
      return withCors(request, new Response("Bad request", { status: 400 }));
    }

    var text = body && body.text;
    if (!text || typeof text !== "string" || text.length > 4000) {
      return withCors(request, new Response("Bad request", { status: 400 }));
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return withCors(request, new Response("Proxy not configured", { status: 500 }));
    }

    var telegramUrl = "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage";

    var tgRes = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      return withCors(request, new Response("Telegram error", { status: 502 }));
    }

    return withCors(
      request,
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      })
    );
  },
};

function withCors(request, response) {
  var origin = request.headers.get("Origin");
  var headers = new Headers(response.headers);
  if (origin && ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers: headers });
}
