# Changelog

## [1.1.0] - 2026-09-11

### Fixed
- 适配 DSH `0.1.5-rc.1`：peerDependencies 从 `^0.1.0-rc.6` 升级到 `^0.1.5-rc.1`（旧的 prerelease 区间不匹配 0.1.5-rc.x，导致安装/启动报错）
- `cordis.patch.yml` 补回 `fetchProvider: http`：补丁是整段替换 `web` 行配置，只写 `searchProvider` 会丢掉 base 层显式设置的 fetch provider
- 清理从 duckduckgo 版本遗留的注释/模块名（`web-search-duckduckgo`、`@module dsh-web-search-duckduckgo`）
- 修复 README_EN.md 的 emoji 乱码

### Changed
- 设置节注册改用电官方同款 `ctx.inject(["settings"])` + `settings.installSection(...)` 模式，命名空间改为普通字符串常量
- provider 改为「单实例 + resolveOptions thunk」模式（对齐官方 `@deepseek-ai/dsh-web-search-deepseek`），每次搜索快照一次配置，不再每次 new 实例
- `available()` 现在校验 endpoint 是合法 URL 且 maxResults 为正整数
- provider 错误信息附带端点恢复指引（对齐官方错误风格）
- `@deepseek-ai/schemastery` 从 peerDependencies 移到 dependencies（对齐官方插件结构）
- 移除未被代码引用的 `@deepseek-ai/dsh-agent` peer 依赖
- User-Agent 更新到 Chrome/131
- HTML 实体解码补充 `&ensp;` `&emsp;` `&thinsp;` `&ndash;` `&mdash;` `&hellip;`

## [1.0.2] - 2026-08-18

### Changed
- 重命名为 dsh-web-search-bing（从 dsh-web-search-duckduckgo 迁移）
- 更新 README 和文档

## [1.0.1] - 2026-08-18

### Changed
- 从 DuckDuckGo 切换到 Bing（cn.bing.com，国内可达）
- 更新 HTML 解析逻辑适配 Bing 页面结构
- 添加 ensearch 参数支持中英文搜索切换
- 添加 accept-language 头部

## [1.0.0] - 2026-08-18

### Added
- 初始版本：DuckDuckGo 免费搜索 provider
- 无需 API Key，不消耗 DeepSeek 搜索配额
- 支持 DSH web 能力接缝注册
