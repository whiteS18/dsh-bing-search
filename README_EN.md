# dsh-web-search-bing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH Compatible](https://img.shields.io/badge/DSH-0.1.5--rc.1-brightgreen)](https://github.com/deepseek-ai/deepseek-harness)

> Free Bing-backed web search provider for DeepSeek Harness (DSH). No API key needed, no search quota consumed.

<p align="right">
  <b>English</b> | <a href="README.md">中文</a>
</p>

> This is a maintenance fork of [godchen520/dsh-web-search-bing](https://github.com/godchen520/dsh-web-search-bing), updated for DSH `0.1.5-rc.1` (peer-dependency conflict fix + patch-layer correction).

## Features

- **Completely Free** — Uses Bing's public HTML search page, no API key required
- **China Accessible** — Defaults to `cn.bing.com`, works in mainland China
- **Zero Quota** — Doesn't consume DeepSeek or any LLM search quota
- **Plug & Play** — Automatically replaces the default search provider after install
- **Configurable** — Switch endpoints, language, and result count

## Installation

```bash
cd $DSH_HOME/profiles/web   # usually ~/.dsh/profiles/web for the desktop app
pnpm add <this-repo-url-or-local-path>
```

Add `"dsh-web-search-bing"` to `dsh.profile.bundles` in the profile's `package.json` (after `@deepseek-ai/dsh-web-app`), then restart DSH.

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-web-search-bing"
      ]
    }
  }
}
```

## Configuration

Adjust in DSH Settings → Plugins → Plugin configuration (the `web-search-bing` section):

| Option | Default | Description |
|--------|---------|-------------|
| `endpoint` | `https://cn.bing.com/search` | Search endpoint |
| `maxResults` | `20` | Max results parsed per search |
| `ensearch` | `0` | `0` = Chinese results, `1` = English |

Or override in the profile's `cordis.patch.yml`:

```yaml
- id: web-search-bing
  config:
    endpoint: https://cn.bing.com/search
    maxResults: 15
    ensearch: 0
```

## Restoring the default search

Change `searchProvider` in this plugin's patch back to `deepseek-official` (or remove this package from `bundles`) and restart.

## How It Works

Queries `cn.bing.com/search` → parses HTML result blocks (`<li class="b_algo">`) → extracts title/URL/snippet → returns to DSH's `web_search` tool.

**No API key, no registration, works out of the box.**

## License

[MIT](LICENSE)
