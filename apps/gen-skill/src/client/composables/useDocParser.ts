import type { FetchedDoc, ParsedDoc, ChunkerConfig } from '@/core/types'
import { htmlToMarkdown, cleanMarkdown } from '@/core/utils/markdown'
import { chunkDocument } from '@/core/utils/chunker'
import { slugify } from '@/core/utils/slug'

export interface UseDocParserReturn {
  parse: (docs: FetchedDoc[], config?: Partial<ChunkerConfig>) => ParsedDoc[]
}

export function useDocParser(): UseDocParserReturn {
  /**
   * Extract path segments for category inference
   */
  function extractPathSegments(path: string): string[] {
    return path
      .split('/')
      .filter(s => s && s !== 'docs' && s !== 'documentation')
      .map(s => slugify(s))
      .filter(s => s)
  }

  /**
   * Infer category path from URL and entry category
   */
  function inferCategory(entry: { url: string; category: string }): string[] {
    const category = slugify(entry.category)
    
    let pathSegments: string[] = []
    
    // Try to extract path segments from URL
    try {
      const url = new URL(entry.url)
      pathSegments = extractPathSegments(url.pathname)
    } catch (e) {
      // If URL parsing fails (e.g., relative URL), extract from the path directly
      pathSegments = extractPathSegments(entry.url)
    }
    
    // Use first path segment if available and different from category
    if (pathSegments.length > 0 && pathSegments[0] !== category) {
      return [category, pathSegments[0]]
    }
    
    return [category]
  }

  /**
   * Parse fetched documents
   */
  function parse(docs: FetchedDoc[], config?: Partial<ChunkerConfig>): ParsedDoc[] {
    const parsed: ParsedDoc[] = []

    for (const doc of docs) {
      // Skip failed fetches
      if (doc.error || !doc.content) {
        continue
      }

      // Convert HTML to Markdown if needed
      let markdown = doc.contentType === 'html' 
        ? htmlToMarkdown(doc.content)
        : doc.content
      
      // Clean markdown
      markdown = cleanMarkdown(markdown)
      
      // Skip empty content
      if (!markdown.trim()) {
        continue
      }

      // Chunk if necessary
      const chunks = chunkDocument(markdown, doc.entry.title, config)
      
      for (const chunk of chunks) {
        parsed.push({
          id: chunk.id,
          title: chunk.title,
          content: chunk.content,
          category: inferCategory(doc.entry),
          originalUrl: doc.entry.url,
          estimatedTokens: chunk.estimatedTokens
        })
      }
    }

    return parsed
  }

  return {
    parse
  }
}
