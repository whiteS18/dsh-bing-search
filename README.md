# dsh-web-search-bing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH Compatible](https://img.shields.io/badge/DSH-0.1.5--rc.1-brightgreen)](https://github.com/deepseek-ai/deepseek-harness)

> DeepSeek Harness (DSH) 的免费 Bing 搜索 provider。无需 API Key，不消耗模型搜索配额。

<p align="right">
  <a href="README_EN.md">English</a> | <b>中文</b>
</p>

> 本仓库是 [godchen520/dsh-web-search-bing](https://github.com/godchen520/dsh-web-search-bing) 的维护分支，已适配 DSH `0.1.5-rc.1`（peerDependencies 冲突修复 + 配置补丁修正）。

## 特点

- **完全免费**：使用 Bing 公共 HTML 搜索页面，无需 API Key
- **国内可达**：默认使用 cn.bing.com，中国大陆可直接访问
- **零配额消耗**：不消耗 DeepSeek 或任何 LLM 的搜索配额
- **即插即用**：安装后自动替换默认搜索 provider
- **可配置**：支持切换搜索端点、中英文结果、结果数量

## 安装

```bash
cd $DSH_HOME/profiles/web   # 桌面版通常为 ~/.dsh/profiles/web
pnpm add <本仓库地址或本地路径>
```

在 profile 的 `package.json` 里把 `"dsh-web-search-bing"` 加入 `dsh.profile.bundles` 数组（放在 `@deepseek-ai/dsh-web-app` 之后），重启 DSH。

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

## 配置

可在 DSH 设置 → Plugins → Plugin configuration 中调整（`web-search-bing` 节）：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `endpoint` | `https://cn.bing.com/search` | 搜索端点 |
| `maxResults` | `20` | 每次搜索最大结果数 |
| `ensearch` | `0` | 0=中文结果，1=英文结果 |

也可以在 profile 的 `cordis.patch.yml` 里覆盖：

```yaml
- id: web-search-bing
  config:
    endpoint: https://cn.bing.com/search
    maxResults: 15
    ensearch: 0
```

## 恢复默认搜索

把本插件 patch 中的 `searchProvider` 改回 `deepseek-official`（或从 bundles 移除本包），重启即可。

## 工作原理

调用 `cn.bing.com/search` → 解析 HTML 搜索结果（`<li class="b_algo">` 块）→ 提取标题/URL/摘要 → 返回给 DSH 的 `web_search` 工具。

**无需 API Key，无需注册，安装即用。**

## License

[MIT](LICENSE)
