# dsh-websearch-bing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH Compatible](https://img.shields.io/badge/DSH-0.1.5--rc.1-brightgreen)](https://github.com/deepseek-ai/deepseek-harness)
[![npm](https://img.shields.io/npm/v/dsh-websearch-bing.svg)](https://www.npmjs.com/package/dsh-websearch-bing)

> Free Bing-backed web search provider for DeepSeek Harness (DSH). No API key needed, no search quota consumed.

<p align="right">
  <b>English</b> | <a href="README.md">中文</a>
</p>

> This is a maintenance fork of [godchen520/dsh-web-search-bing](https://github.com/godchen520/dsh-web-search-bing), updated for DSH `0.1.5-rc.1` (peer-dependency conflict fix + patch-layer correction). The package is published as `dsh-websearch-bing` because `dsh-web-search-bing` is already taken on npm.

## Features

- **Completely Free** — Uses Bing's public HTML search page, no API key required
- **China Accessible** — Defaults to `cn.bing.com`, works in mainland China
- **Zero Quota** — Doesn't consume DeepSeek or any LLM search quota
- **Plug & Play** — Switches `web_search` to `bing-free` after install
- **Configurable** — Switch endpoints, language, and result count

## Installation

npm:

```sh
dsh plugin --profile desktop add dsh-websearch-bing
```

GitHub:

```sh
dsh plugin --profile desktop add github:whiteS18/dsh-websearch-bing
```

Use `web` instead of `desktop` for the web profile. Restart DSH after install.

Or install by hand in the profile directory:

```sh
cd $DSH_HOME/profiles/desktop   # usually ~/.dsh/profiles/desktop for the desktop app
pnpm add dsh-websearch-bing
```

Then add `"dsh-websearch-bing"` to `dsh.profile.bundles` (after `@deepseek-ai/dsh-web-app`) and restart DSH.

## Configuration

This version has no Settings card. Edit `~/.dsh/settings.yaml` (hot-reloaded):

```yaml
websearch-bing:
  endpoint: https://cn.bing.com/search
  maxResults: 20
  ensearch: 0
```

Or override in the profile `cordis.patch.yml` and restart:

```yaml
- id: websearch-bing
  config:
    endpoint: https://cn.bing.com/search
    maxResults: 15
    ensearch: 0
```

| Option | Default | Description |
|--------|---------|-------------|
| `endpoint` | `https://cn.bing.com/search` | Search endpoint |
| `maxResults` | `20` | Max results parsed per search |
| `ensearch` | `0` | `0` = Chinese results, `1` = English |

The **Web Search** card under Settings → Plugins → Plugin configuration belongs to official `web-search-deepseek`, not this plugin.

## How to confirm Bing is in use

Temporarily set `endpoint` to an invalid URL and search again. If the error names `websearch-bing` and the endpoint you set, this provider handled the request. Restore the endpoint afterwards.

## Restoring the default search

Change `searchProvider` in this plugin's patch back to `deepseek-official` (or remove this package from `bundles`) and restart.

## How It Works

Queries `cn.bing.com/search` → parses HTML result blocks (`<li class="b_algo">`) → extracts title/URL/snippet → returns to DSH's `web_search` tool.

## License

[MIT](LICENSE)
