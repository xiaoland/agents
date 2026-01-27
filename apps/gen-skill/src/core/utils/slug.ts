/**
 * Slugify text for use in filenames and URLs
 * "Generate Text API" → "generate-text-api"
 * "RAG Agent 指南" → "rag-agent-指南" (保留中文)
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/[^\w\u4e00-\u9fa5.-]/g, '') // keep alphanumeric, Chinese, dots, and hyphens
    .replace(/--+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')          // remove leading/trailing hyphens
}

/**
 * Convert category and title to file path
 * ("API Reference", "generateText") → "api-reference/generate-text.md"
 */
export function toFilePath(category: string, title: string): string {
  const categorySlug = slugify(category)
  const titleSlug = slugify(title)
  return `${categorySlug}/${titleSlug}.md`
}
