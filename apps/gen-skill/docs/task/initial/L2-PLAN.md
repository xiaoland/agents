# L2 结构层设计文档

> Skill Generator - 从文档站生成 Agent Skill 的 CSR Web 应用

## 概述

### 项目目标

- 输入：文档站网址（如 `ai-sdk.dev`）
- 输出：Agent Skill ZIP 包，包含 `SKILL.md` + `references/` 目录结构
- 部署：Cloudflare Workers（纯静态 SPA，预留服务端扩展）

### 核心约束

- 纯 CSR，无需服务器支持
- 只支持启用 CORS 或提供 `llms.txt` 的文档站
- 禁止大文件，必须拆分为合理粒度的 references
- MVP 验收标准：能处理 `ai-sdk.dev`

---

## 目录结构

```
/
├── src/
│   ├── client/                   # 前端 Vue 应用
│   │   ├── composables/
│   │   │   ├── useDocSiteDiscovery.ts
│   │   │   ├── useDocFetcher.ts
│   │   │   ├── useDocParser.ts
│   │   │   ├── useSkillGenerator.ts
│   │   │   └── useZipExporter.ts
│   │   ├── components/
│   │   │   ├── UrlInput.vue
│   │   │   ├── DiscoveryResult.vue
│   │   │   ├── FetchProgress.vue
│   │   │   ├── SkillPreview.vue
│   │   │   └── ExportButton.vue
│   │   ├── App.vue
│   │   └── main.ts
│   │
│   ├── core/                     # 共享核心逻辑（前后端复用）
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── markdown.ts
│   │   │   ├── chunker.ts
│   │   │   ├── slug.ts
│   │   │   └── llms-txt-parser.ts
│   │   └── index.ts
│   │
│   └── worker/                   # 预留：Cloudflare Worker 服务端逻辑
│       └── index.ts              # 预留入口（未来可添加 API 路由）
│
├── public/                       # 静态资源（favicon 等）
├── dist/                         # 构建输出（Vite 输出到此）
│
├── index.html                    # Vite 入口
├── vite.config.ts
├── wrangler.jsonc                # Cloudflare Workers 配置
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

---

## 模块位置映射

| 模块 | 位置 |
|------|------|
| 类型定义 | `src/core/types/index.ts` |
| chunker | `src/core/utils/chunker.ts` |
| markdown | `src/core/utils/markdown.ts` |
| slug | `src/core/utils/slug.ts` |
| llms-txt-parser | `src/core/utils/llms-txt-parser.ts` |
| useDocSiteDiscovery | `src/client/composables/useDocSiteDiscovery.ts` |
| useDocFetcher | `src/client/composables/useDocFetcher.ts` |
| useDocParser | `src/client/composables/useDocParser.ts` |
| useSkillGenerator | `src/client/composables/useSkillGenerator.ts` |
| useZipExporter | `src/client/composables/useZipExporter.ts` |
| Worker 入口（预留） | `src/worker/index.ts` |

---

## 核心类型定义

```
模块：核心类型
位置：src/core/types/index.ts
```

```typescript
// ============ 文档发现阶段 ============

type DocSiteType = 'llms-txt' | 'llms-full' | 'unknown'

interface DiscoveryResult {
  type: DocSiteType
  baseUrl: string
  llmsTxtUrl: string | null
  llmsFullTxtUrl: string | null
  entries: DocEntry[]
  rawContent: string          // llms.txt 原始内容
}

interface DocEntry {
  title: string
  url: string
  description: string
  category: string            // 从 ## 标题推断，如 "Docs", "API Reference"
}

// ============ 文档抓取阶段 ============

interface FetchedDoc {
  entry: DocEntry
  content: string             // 原始内容
  contentType: 'markdown' | 'html'
  fetchedAt: number
  error?: string
}

interface FetchProgress {
  total: number
  completed: number
  current: string             // 当前正在抓取的 URL
  errors: string[]
}

// ============ 文档解析阶段 ============

interface ParsedDoc {
  id: string                  // slugified，用于文件名
  title: string
  content: string             // 清理后的 Markdown
  category: string[]          // 路径层级，如 ['api', 'core']
  originalUrl: string
  estimatedTokens: number
}

// ============ Skill 生成阶段 ============

interface SkillMeta {
  name: string                // 如 "Vercel AI SDK"
  description: string         // 简短描述（< 200 chars）
  version?: string
  sourceUrl: string           // 原文档站 URL
}

interface SkillReference {
  path: string                // 如 'references/api/generateText.md'
  content: string
  title: string
}

interface SkillPackage {
  skillMd: string             // SKILL.md 内容
  references: SkillReference[]
}

// ============ Chunker ============

interface ChunkerConfig {
  targetTokens: number        // 默认 3000
  maxTokens: number           // 默认 6000
  minTokens: number           // 默认 500
}

interface Chunk {
  id: string
  title: string
  content: string
  level: number               // 2=H2, 3=H3
  estimatedTokens: number
}
```

---

## 模块详细设计

### 1. 文档发现服务

```
模块：文档发现服务
位置：src/client/composables/useDocSiteDiscovery.ts
类型：Composable
依赖：src/core/utils/llms-txt-parser.ts
```

```typescript
interface UseDocSiteDiscoveryReturn {
  discover: (baseUrl: string) => Promise<DiscoveryResult>
  loading: Ref<boolean>
  error: Ref<Error | null>
}
```

**职责：**

- 规范化输入 URL（移除尾部斜杠等）
- 尝试 fetch `{baseUrl}/llms.txt`
- 尝试 fetch `{baseUrl}/llms-full.txt`
- 解析 llms.txt 格式：
  - H1 → 站点名称
  - blockquote → 站点描述
  - H2 → category
  - `[title](url): description` → DocEntry
- 返回 DiscoveryResult

**llms.txt 解析规则：**

```
# Site Name                     → meta.name
> Site description              → meta.description

## Category Name                → entry.category
- [Title](url): Description     → { title, url, description, category }
```

---

### 2. 文档抓取服务

```
模块：文档抓取服务
位置：src/client/composables/useDocFetcher.ts
类型：Composable
依赖：DiscoveryResult
```

```typescript
interface UseDocFetcherReturn {
  fetchAll: (entries: DocEntry[]) => Promise<FetchedDoc[]>
  fetchOne: (entry: DocEntry) => Promise<FetchedDoc>
  progress: Ref<FetchProgress>
  abort: () => void
  loading: Ref<boolean>
}
```

**职责：**

- 并发控制：最多同时 5 个请求
- 自动重试：失败后重试 1 次
- 超时处理：单个请求 30s 超时
- 进度报告
- 支持中断

**抓取策略：**

1. 如果 URL 以 `.md` 结尾 → 直接 fetch，contentType = 'markdown'
2. 否则尝试 `{url}.md` → 如果成功，contentType = 'markdown'
3. 否则 fetch 原始 URL → contentType = 'html'

---

### 3. 文档解析服务

```
模块：文档解析服务
位置：src/client/composables/useDocParser.ts
类型：Composable
依赖：FetchedDoc[], src/core/utils/chunker.ts, src/core/utils/markdown.ts
```

```typescript
interface UseDocParserReturn {
  parse: (docs: FetchedDoc[], config?: Partial<ChunkerConfig>) => ParsedDoc[]
}
```

**职责：**

- HTML → Markdown 转换（如果 contentType = 'html'）
- 清理无关内容（导航、footer、广告）
- 调用 chunker 拆分大文件
- 生成规范化 id（slugify title）
- 推断 category 路径

**清理规则：**

- 移除 `<nav>`, `<footer>`, `<aside>` 等标签
- 移除重复的 H1（通常是页面标题）
- 移除空链接、无效图片
- 规范化代码块语言标记

---

### 4. 大文件拆分工具

```
模块：大文件拆分
位置：src/core/utils/chunker.ts
类型：Utility
依赖：无
```

```typescript
function chunkDocument(
  content: string,
  title: string,
  config?: Partial<ChunkerConfig>
): Chunk[]

function estimateTokens(content: string): number

// 默认配置
const DEFAULT_CONFIG: ChunkerConfig = {
  targetTokens: 3000,
  maxTokens: 6000,
  minTokens: 500
}
```

**拆分阈值（基于调研）：**

| 参数 | 值 | 说明 |
|------|-----|------|
| targetTokens | 3000 | 目标大小，约 2000-2500 words |
| maxTokens | 6000 | 硬上限，约 4500 words |
| minTokens | 500 | 最小大小，避免过度拆分 |

**拆分算法：**

```
1. estimateTokens(content)
2. if tokens <= maxTokens → 返回单个 chunk
3. 按 H2 (##) 分割
4. 对每个 section:
   a. if tokens <= maxTokens → 保留
   b. else → 递归按 H3 (###) 分割
   c. if 单个 H3 仍然过大 → 按段落边界分割
5. 合并相邻的小 chunks (< minTokens)
6. 为每个 chunk 生成 id: `{parentId}-{sectionSlug}`
```

**Token 估算：**

```typescript
function estimateTokens(content: string): number {
  // 简单估算：英文约 4 chars/token，中文约 2 chars/token
  const words = content.split(/\s+/).length
  const chars = content.length
  return Math.ceil(Math.max(words * 1.3, chars / 4))
}
```

---

### 5. Skill 生成服务

```
模块：Skill 生成服务
位置：src/client/composables/useSkillGenerator.ts
类型：Composable
依赖：ParsedDoc[], src/core/utils/slug.ts
```

```typescript
interface UseSkillGeneratorReturn {
  generate: (docs: ParsedDoc[], meta: SkillMeta) => SkillPackage
}
```

**职责：**

- 生成 SKILL.md（包含 YAML frontmatter）
- 组织 references 目录结构
- 生成每个 reference 文件

**SKILL.md 模板：**

```markdown
---
name: {slugified-name}
description: {description}
---

# {name}

> {description}

Source: {sourceUrl}

## Overview

{从 llms.txt 的 blockquote 或第一个文档提取}

## References

Use these references for detailed information:

### {Category 1}
- `references/{category1}/{file1}.md`: {title1}
- `references/{category1}/{file2}.md`: {title2}

### {Category 2}
- `references/{category2}/{file3}.md`: {title3}

## Quick Start

{如果存在 getting-started 或 quickstart 文档，提取核心步骤}
```

**References 组织：**

```
references/
├── getting-started/
│   └── installation.md
├── api/
│   ├── generate-text.md
│   └── stream-text.md
└── guides/
    ├── rag-agent.md
    └── tool-calling.md
```

---

### 6. ZIP 打包服务

```
模块：ZIP 打包服务
位置：src/client/composables/useZipExporter.ts
类型：Composable
依赖：JSZip
```

```typescript
interface UseZipExporterReturn {
  exportZip: (pkg: SkillPackage, filename?: string) => Promise<void>
  loading: Ref<boolean>
}
```

**职责：**

- 创建 ZIP 结构
- 触发浏览器下载

**ZIP 结构：**

```
{skill-name}.zip
├── SKILL.md
└── references/
    ├── {category}/
    │   └── {file}.md
    └── ...
```

---

### 7. 辅助工具

#### Slug 生成

```
模块：Slug 生成
位置：src/core/utils/slug.ts
```

```typescript
function slugify(text: string): string
// "Generate Text API" → "generate-text-api"
// "RAG Agent 指南" → "rag-agent-指南" (保留中文)

function toFilePath(category: string, title: string): string
// ("API Reference", "generateText") → "api-reference/generate-text.md"
```

#### Markdown 工具

```
模块：Markdown 工具
位置：src/core/utils/markdown.ts
```

```typescript
function htmlToMarkdown(html: string): string
function cleanMarkdown(md: string): string
function extractFirstParagraph(md: string): string
function extractHeadings(md: string): { level: number; text: string }[]
```

#### llms.txt 解析器

```
模块：llms.txt 解析器
位置：src/core/utils/llms-txt-parser.ts
```

```typescript
interface LlmsTxtMeta {
  name: string
  description: string
}

interface ParsedLlmsTxt {
  meta: LlmsTxtMeta
  entries: DocEntry[]
}

function parseLlmsTxt(content: string): ParsedLlmsTxt
```

---

## 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户输入 URL                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  useDocSiteDiscovery.discover(url)                              │
│  ├── fetch /llms.txt                                            │
│  ├── fetch /llms-full.txt                                       │
│  └── 解析 entries                                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ DiscoveryResult
┌─────────────────────────────────────────────────────────────────┐
│  useDocFetcher.fetchAll(entries)                                │
│  ├── 并发抓取（max 5）                                           │
│  ├── 自动重试                                                    │
│  └── 进度报告                                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ FetchedDoc[]
┌─────────────────────────────────────────────────────────────────┐
│  useDocParser.parse(docs)                                       │
│  ├── HTML → Markdown                                            │
│  ├── 清理无关内容                                                │
│  ├── chunker.chunkDocument() 拆分大文件                          │
│  └── 生成 id, category                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ ParsedDoc[]
┌─────────────────────────────────────────────────────────────────┐
│  useSkillGenerator.generate(docs, meta)                         │
│  ├── 生成 SKILL.md                                              │
│  └── 组织 references                                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ SkillPackage
┌─────────────────────────────────────────────────────────────────┐
│  useZipExporter.exportZip(pkg)                                  │
│  ├── 创建 ZIP                                                   │
│  └── 触发下载                                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      下载 {skill-name}.zip                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cloudflare Workers 配置

### wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "skill-generator",
  "compatibility_date": "2025-01-26",
  
  // 静态资源配置（当前 MVP：纯静态 SPA）
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
  
  // 预留：未来添加 Worker 服务端
  // "main": "src/worker/index.ts",
  // "assets": {
  //   "directory": "./dist",
  //   "binding": "ASSETS",
  //   "not_found_handling": "single-page-application"
  // }
}
```

### 部署流程

```bash
# 开发
pnpm dev              # vite dev server

# 构建
pnpm build            # vite build → dist/

# 部署到 Cloudflare Workers
pnpm deploy           # wrangler deploy
```

---

## 未来扩展：服务端能力

当需要服务端能力时（如代理抓取绕过 CORS）：

1. 取消 `wrangler.jsonc` 中 `main` 的注释
2. 在 `src/worker/index.ts` 实现 API 路由
3. 添加 `assets.binding` 以便 Worker 可以访问静态资源

```typescript
// src/worker/index.ts（未来）
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // API 路由
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/proxy') {
        // 代理抓取，绕过 CORS
        const targetUrl = url.searchParams.get('url')
        return fetch(targetUrl)
      }
    }
    
    // 其他请求交给静态资源
    return env.ASSETS.fetch(request)
  }
}
```

---

## 依赖清单

```json
{
  "dependencies": {
    "vue": "^3.5.x",
    "jszip": "^3.10.x",
    "turndown": "^7.x",
    "marked": "^12.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^6.x",
    "@vitejs/plugin-vue": "^5.x",
    "wrangler": "^4.x"
  }
}
```

---

## 拆分阈值设计依据

基于以下调研确定 token 阈值：

### Agent Skill 标准要点

| 要点 | 来源 |
|------|------|
| SKILL.md 建议 < 5000 words（约 6500 tokens） | Anthropic 官方博客 |
| Progressive disclosure 架构 | Claude Docs |
| references/ 按需加载 | Anthropic Engineering |

### 主流模型上下文窗口

| 模型 | 标准窗口 | 扩展窗口 |
|------|---------|---------|
| Claude Sonnet 4.5 | 200K | 1M (beta) |
| Claude Haiku 4.5 | 200K | - |
| Grok 3 | 131K (API 实际) | 1M (理论) |
| Grok 4 Fast | 256K | 2M |

### 阈值决策

采用保守策略确保兼容性：

- **单个 reference 文件目标**：2000-4000 tokens（约 1500-3000 words）
- **单个 reference 文件硬上限**：6000 tokens（约 4500 words）
- **SKILL.md 主文件**：< 3000 tokens
