# dsh-bing-search

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH Compatible](https://img.shields.io/badge/DSH-0.1.5--rc.1-brightgreen)](https://github.com/deepseek-ai/deepseek-harness)
[![npm](https://img.shields.io/npm/v/dsh-bing-search.svg)](https://www.npmjs.com/package/dsh-bing-search)

> DeepSeek Harness (DSH) 的免费 Bing 搜索 provider。无需 API Key，不消耗模型搜索配额。

<p align="right">
  <a href="README_EN.md">English</a> | <b>中文</b>
</p>

> 本仓库是 [godchen520/dsh-web-search-bing](https://github.com/godchen520/dsh-web-search-bing) 的维护 fork，已适配 DSH `0.1.5-rc.1`。包名用 `dsh-bing-search`，因为 `dsh-web-search-bing` 已被占用，`dsh-websearch-bing` 又被 npm 判定过于相似。

## 特点

- **完全免费**：使用 Bing 公共 HTML 搜索页面，无需 API Key
- **国内可达**：默认使用 cn.bing.com，中国大陆可直接访问
- **零配额消耗**：不消耗 DeepSeek 或任何 LLM 的搜索配额
- **即插即用**：安装后自动把 `web_search` 切到 `bing-free`
- **可配置**：支持切换搜索端点、中英文结果、结果数量

## 安装

npm：

```sh
dsh plugin --profile desktop add dsh-bing-search
```

GitHub：

```sh
dsh plugin --profile desktop add github:whiteS18/dsh-bing-search
```

网页版 profile 把 `desktop` 换成 `web`。装完重启 DSH。

也可以在 profile 目录手动安装：

```sh
cd $DSH_HOME/profiles/desktop   # 桌面版通常为 ~/.dsh/profiles/desktop
pnpm add dsh-bing-search
```

然后把 `"dsh-bing-search"` 加入 `dsh.profile.bundles`（放在 `@deepseek-ai/dsh-web-app` 之后），重启 DSH。

**注意：** `node_modules` 里的目录名必须等于 `package.json` 的 `name`。不要用旧名 `dsh-web-search-bing` 去 link 这个目录，否则桌面端会报 `profile package identity is invalid`。

## 配置

当前版本没有设置页卡片。改 `~/.dsh/settings.yaml`（热加载）：

```yaml
bing-search:
  endpoint: https://cn.bing.com/search
  maxResults: 20
  ensearch: 0
```

或改 profile 的 `cordis.patch.yml` 后重启：

```yaml
- id: bing-search
  config:
    endpoint: https://cn.bing.com/search
    maxResults: 15
    ensearch: 0
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `endpoint` | `https://cn.bing.com/search` | 搜索端点 |
| `maxResults` | `20` | 每次搜索最大结果数 |
| `ensearch` | `0` | 0=中文结果，1=英文结果 |

设置 → 插件 → 插件配置 里的 **Web Search** 卡片属于官方 `web-search-deepseek`，不是本插件。

## 如何确认走的是 Bing

把 endpoint 临时改成无效地址后再搜一次。如果报错包含 `bing-search` 和你写的 endpoint，就是本 provider。测完改回去。

## 恢复默认搜索

把本插件 patch 中的 `searchProvider` 改回 `deepseek-official`（或从 bundles 移除本包），重启即可。

## 工作原理

调用 `cn.bing.com/search` → 解析 HTML 搜索结果（`<li class="b_algo">` 块）→ 提取标题/URL/摘要 → 返回给 DSH 的 `web_search` 工具。

## License

[MIT](LICENSE)
