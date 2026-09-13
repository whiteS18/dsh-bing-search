/**
 * Types for the Bing-backed free web search provider bundle.
 * @module dsh-bing-search
 */

/** One normalized search hit returned by a provider. */
export interface WebSource {
    url: string;
    title?: string;
    snippet?: string;
    publishedAt?: string;
}
/** The request the web seam forwards to a search provider. */
export interface WebSearchRequest {
    query: string;
    maxResults?: number;
}
/** The normalized result a search provider resolves with. */
export interface WebSearchResult {
    sources: WebSource[];
    truncated: boolean;
}
/** The provider contract `ctx.web.registerSearchProvider` accepts. */
export interface WebSearchProvider {
    readonly id: string;
    available(): boolean;
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}
/** Fully-defaulted options one search executes with. */
export interface BingFreeSearchOptions {
    endpoint: string;
    maxResults: number;
    ensearch: number;
}
/** Stable provider id (bing-free). */
export declare const PROVIDER_ID: string;
/** Default public HTML search endpoint (cn.bing.com/search). */
export declare const DEFAULT_ENDPOINT: string;
/** Default ensearch param (0 = Chinese results). */
export declare const DEFAULT_ENSEARCH: number;
/** Default upper bound on parsed results per page. */
export declare const DEFAULT_MAX_RESULTS: number;
/** Settings namespace for this provider (`bing-search`). */
export declare const WEB_SEARCH_BING_SETTINGS_NAMESPACE: string;
/**
 * The Bing-backed free provider, satisfying {@link WebSearchProvider}.
 * `available()` reports whether the configured endpoint is a parseable URL —
 * no key, credential, or environment setup is required.
 */
export declare class BingFreeSearchProvider implements WebSearchProvider {
    readonly id: string;
    constructor(resolveOptions: () => BingFreeSearchOptions);
    available(): boolean;
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}
/** Cordis plugin name. */
export declare const name: string;
/** Services injected by this plugin. */
export declare const inject: string[];
/** Schema for the config / settings section. */
export declare const Config: unknown;
/** Cordis plugin apply entry: registers the provider with `ctx.web`. */
export declare function apply(ctx: any, config: any): void;
