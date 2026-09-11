import z from "@deepseek-ai/schemastery";
import { WebError } from "@deepseek-ai/dsh-web";

//#region provider
/**
 * Bing-backed free web search provider for the `ctx.web` seam.
 *
 * This provider performs a plain HTTPS GET against Bing's public HTML search
 * page (cn.bing.com for Chinese results, or any Bing endpoint you configure)
 * and parses the result blocks it returns. It needs NO API key and makes NO
 * model call, so the `web_search` tool works here without spending DeepSeek
 * (or any LLM) search quota.
 *
 * cn.bing.com is accessible from mainland China, making this a practical
 * default for domestic DSH deployments where DuckDuckGo is blocked.
 *
 * The endpoint is fully configurable via the `websearch-bing` settings
 * section or the cordis config, so you can switch to any search engine that
 * serves an HTML results page.
 * @module dsh-websearch-bing/provider
 */

/** Stable id this provider registers under. */
const PROVIDER_ID = "bing-free";

/** Default endpoint: Bing China, Chinese results. `q=` is appended at call time. */
const DEFAULT_ENDPOINT = "https://cn.bing.com/search";

/** Default `ensearch` param: `0` = Chinese results, `1` = English. */
const DEFAULT_ENSEARCH = 0;

/** Default upper bound on results parsed per page. */
const DEFAULT_MAX_RESULTS = 20;

/**
 * Browser-ish User-Agent. Bing may reject bare Node/undici agents; a
 * conservative desktop UA keeps it serving normal result pages.
 */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * HTML-decode an attribute/value minus markup. Bing escapes `&amp;`, `&lt;`
 * etc. and may include `&#xNN;` or `&#NNN;` entities; decoding keeps titles
 * and snippets human-readable.
 *
 * @param {string | null | undefined} value - the raw string to decode.
 * @returns {string} the decoded string.
 */
function decodeHtml(value) {
  if (value == null) return "";
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&ensp;/g, " ")
    .replace(/&emsp;/g, " ")
    .replace(/&thinsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse one `<li class="b_algo">` block from Bing's HTML into a source.
 *
 * @param {string} blockHtml - the inner HTML of one result `<li>`.
 * @returns {{ url: string, title: string, snippet: string } | null} the parsed
 *   fields, or `null` when the block has no usable link.
 */
function parseBingResultBlock(blockHtml) {
  // Title + URL: <h2><a href="URL" ...>Title</a></h2>
  const titleMatch = /<h2[^>]*>\s*<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(blockHtml);
  if (titleMatch == null) return null;
  const href = decodeHtml(titleMatch[1].trim());
  const title = decodeHtml(titleMatch[2]);
  // Resolve URL — Bing sometimes uses relative or redirect URLs.
  let url;
  try {
    if (href.startsWith("//")) url = `https:${href}`;
    else if (href.startsWith("/")) url = `https://cn.bing.com${href}`;
    else url = new URL(href).href;
  } catch {
    url = href;
  }
  if (!(url.startsWith("https://") || url.startsWith("http://"))) return null;
  // Snippet: try multiple selectors Bing uses across versions.
  let snippet = "";
  const snippetPatterns = [
    /<p[^>]*class\s*=\s*["'][^"']*\bb_lineclamp[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*class\s*=\s*["'][^"']*\bcaption\b[^"']*["'][^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/i,
    /<p[^>]*class\s*=\s*["'][^"']*\bb_algoSlug\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/i
  ];
  for (const pat of snippetPatterns) {
    const m = pat.exec(blockHtml);
    if (m != null && m[1].length > snippet.length) snippet = decodeHtml(m[1]);
  }
  return { url, title, snippet };
}

/**
 * Parse Bing's HTML results page into source objects.
 *
 * Bing renders organic results as `<li class="b_algo">` inside an `<ol>`.
 * Parsing is tolerant: it extracts every `<li class="b_algo">` block,
 * parses title + URL + snippet from each, and dedupes by URL.
 *
 * @param {string} html - the raw result page body.
 * @param {number | undefined} maxResults - parsed source cap; unset means parse the whole page.
 * @returns {Array<{ url: string, title?: string, snippet?: string }>} the normalized sources.
 */
function parseBingHtml(html, maxResults) {
  const sources = [];
  const seen = new Set();
  // Split on <li class="b_algo"> boundaries — each block is one result.
  const blocks = html.split(/<li\s+class\s*=\s*["']?\s*b_algo\b/i);
  // Skip the first element (everything before the first result).
  for (let i = 1; i < blocks.length && (maxResults == null || sources.length < maxResults); i++) {
    // Trim to the next </li> to avoid parsing across blocks.
    const block = blocks[i].split(/<\/li>/i)[0] ?? blocks[i];
    const parsed = parseBingResultBlock(block);
    if (parsed == null || seen.has(parsed.url)) continue;
    seen.add(parsed.url);
    sources.push({
      url: parsed.url,
      ...(parsed.title.length > 0 ? { title: parsed.title } : {}),
      ...(parsed.snippet.length > 0 ? { snippet: parsed.snippet } : {})
    });
  }
  return sources;
}

/**
 * True when an otherwise-2xx Bing page is actually a captcha/bot gate.
 *
 * @param {string} html - the response body.
 * @returns {boolean} whether the page looks like a block/captcha gate.
 */
function looksBlocked(html) {
  const lower = html.slice(0, 20000).toLowerCase();
  return /(captcha|verify you are human|are you a robot|unusual traffic|access denied|challenge-platform)/.test(lower);
}

/**
 * Build a fetch error that the seam surfaces as a structured provider failure.
 * The endpoint is named so configuration mistakes are recoverable from the
 * error text alone.
 *
 * @param {string} endpoint - the endpoint the request used.
 * @param {string} message - the human-readable failure.
 * @param {unknown} [cause] - the underlying error, when any.
 * @returns {WebError} a {@link WebError} with code `WEB_PROVIDER_ERROR`.
 */
function providerError(endpoint, message, cause) {
  return new WebError(
    `${message}\n\nThe web search request used endpoint ${JSON.stringify(endpoint)}. If that endpoint is not intended, set websearch-bing.endpoint in ~/.dsh/settings.yaml, or set the endpoint key of the websearch-bing cordis config. Only the user should choose or change the endpoint.`,
    "WEB_PROVIDER_ERROR",
    cause === undefined ? undefined : { cause }
  );
}

/** Throw the provider's stable cancellation error when the caller already aborted. */
function throwIfSearchAborted(signal) {
  if (signal?.aborted === true) throw searchAborted(signal);
}

/** Build the provider's stable cancellation error while retaining the caller's reason. */
function searchAborted(signal, fallback) {
  return new WebError("Bing free search aborted", "WEB_ABORTED", { cause: signal?.aborted === true ? signal.reason : fallback });
}

/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * The Bing-backed free search provider.
 *
 * `available()` reports whether the configured endpoint is a parseable URL:
 * the provider needs no key, credential, or environment setup, so a valid
 * endpoint is the only precondition.
 */
class BingFreeSearchProvider {
  id = PROVIDER_ID;

  /**
   * @param {() => { endpoint: string, maxResults: number, ensearch: number }} resolveOptions -
   *   the options for the NEXT operation, snapshotted once at each operation's
   *   entry so one search never mixes two sections. A thunk rather than a value
   *   because the plugin's settings section can change between searches, and
   *   re-registering the provider to carry a new endpoint would make the seam's
   *   selection observable to the user as a flicker.
   */
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions;
  }

  available() {
    const options = this.resolveOptions();
    return URL.canParse(options.endpoint) && Number.isInteger(options.maxResults) && options.maxResults > 0;
  }

  async search(request, signal) {
    const options = this.resolveOptions();
    const query = (request.query ?? "").trim();
    if (query.length === 0) throw providerError(options.endpoint, "Bing free search requires a non-empty query");
    throwIfSearchAborted(signal);
    const params = new URLSearchParams({ q: query, ensearch: String(options.ensearch) });
    const url = `${options.endpoint}?${params.toString()}`;
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8"
        },
        ...(signal !== undefined ? { signal } : {})
      });
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
      throw providerError(options.endpoint, `Bing free search request failed: ${String(error)}`, error);
    }
    if (!response.ok) {
      throw providerError(options.endpoint, `Bing search returned HTTP ${response.status}`);
    }
    let html;
    try {
      html = await response.text();
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw searchAborted(signal, error);
      throw providerError(options.endpoint, `Bing returned an unreadable response body: ${String(error)}`, error);
    }
    if (looksBlocked(html)) {
      throw providerError(
        options.endpoint,
        "Bing answered with a captcha/gate instead of results. Retry later, or switch the searchProvider to another backend."
      );
    }
    const sources = parseBingHtml(html, options.maxResults);
    return { sources, truncated: false };
  }
}
//#endregion

//#region index
/**
 * Register a free Bing-backed provider in `ctx.web`. It calls Bing's public
 * HTML endpoint and needs no API key, so `web_search` runs without any
 * DeepSeek/model search quota. The provider id is `bing-free`; the bundle's
 * `cordis.patch.yml` sets `web.searchProvider` to it.
 *
 * Optional settings expose the endpoint, language mode, and parse cap for
 * deployments that need a different mirror, language, or page budget.
 * @module dsh-websearch-bing
 */

/** Cordis plugin name used by loader diagnostics. */
const name = "websearch-bing";

/** The web seam this provider registers into. */
const inject = ["web"];

const Config = z.object({
  endpoint: z.string().default(DEFAULT_ENDPOINT),
  maxResults: z.number().step(1).min(1).default(DEFAULT_MAX_RESULTS),
  ensearch: z.number().step(1).min(0).max(1).default(DEFAULT_ENSEARCH)
});

/** Settings namespace carrying this provider's endpoint and parse cap. */
const WEB_SEARCH_BING_SETTINGS_NAMESPACE = "websearch-bing";

/**
 * Project one resolved section into the options the provider serves its next
 * search with: every value it reads is already fully defaulted.
 *
 * @param {unknown} config - the currently authoritative section.
 * @returns {{ endpoint: string, maxResults: number, ensearch: number }} options for one search.
 */
function resolveOptions(config) {
  return {
    endpoint: config?.endpoint ?? DEFAULT_ENDPOINT,
    maxResults: config?.maxResults ?? DEFAULT_MAX_RESULTS,
    ensearch: config?.ensearch ?? DEFAULT_ENSEARCH
  };
}

/** Register the free Bing search provider with `ctx.web`. */
function apply(ctx, config) {
  let current = () => config;
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, WEB_SEARCH_BING_SETTINGS_NAMESPACE, Config, config, {
      setSource: (source) => {
        current = source;
      },
      onChange: () => {}
    });
  });
  ctx.web.registerSearchProvider(new BingFreeSearchProvider(() => resolveOptions(current())));
}

export {
  Config,
  DEFAULT_ENDPOINT,
  DEFAULT_ENSEARCH,
  DEFAULT_MAX_RESULTS,
  PROVIDER_ID,
  BingFreeSearchProvider,
  WEB_SEARCH_BING_SETTINGS_NAMESPACE,
  apply,
  inject,
  name
};
//#endregion
