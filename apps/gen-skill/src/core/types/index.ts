// ============ 文档发现阶段 ============

export type DocSiteType = 'llms-txt' | 'llms-full' | 'unknown'

export interface DiscoveryResult {
  type: DocSiteType
  baseUrl: string
  llmsTxtUrl: string | null
  llmsFullTxtUrl: string | null
  entries: DocEntry[]
  rawContent: string          // llms.txt 原始内容
}

export interface DocEntry {
  title: string
  url: string
  description: string
  category: string            // 从 ## 标题推断，如 "Docs", "API Reference"
}

// ============ 文档抓取阶段 ============

export interface FetchedDoc {
  entry: DocEntry
  content: string             // 原始内容
  contentType: 'markdown' | 'html'
  fetchedAt: number
  error?: string
}

export interface FetchProgress {
  total: number
  completed: number
  current: string             // 当前正在抓取的 URL
  errors: string[]
}

// ============ 文档解析阶段 ============

export interface ParsedDoc {
  id: string                  // slugified，用于文件名
  title: string
  content: string             // 清理后的 Markdown
  category: string[]          // 路径层级，如 ['api', 'core']
  originalUrl: string
  estimatedTokens: number
}

// ============ Skill 生成阶段 ============

export interface SkillMeta {
  name: string                // 如 "Vercel AI SDK"
  description: string         // 简短描述（< 200 chars）
  version?: string
  sourceUrl: string           // 原文档站 URL
}

export interface SkillReference {
  path: string                // 如 'references/api/generateText.md'
  content: string
  title: string
}

export interface SkillPackage {
  skillMd: string             // SKILL.md 内容
  references: SkillReference[]
}

// ============ Chunker ============

export interface ChunkerConfig {
  targetTokens: number        // 默认 3000
  maxTokens: number           // 默认 6000
  minTokens: number           // 默认 500
}

export interface Chunk {
  id: string
  title: string
  content: string
  level: number               // 2=H2, 3=H3
  estimatedTokens: number
}

// ============ llms.txt 解析 ============

export interface LlmsTxtMeta {
  name: string
  description: string
}

export interface ParsedLlmsTxt {
  meta: LlmsTxtMeta
  entries: DocEntry[]
}
