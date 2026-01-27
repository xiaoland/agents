import type { ChunkerConfig, Chunk } from '../types'
import { slugify } from './slug'

export const DEFAULT_CONFIG: ChunkerConfig = {
  targetTokens: 3000,
  maxTokens: 6000,
  minTokens: 500
}

/**
 * Estimate token count for a given text
 * Simple estimation: English ~4 chars/token, Chinese ~2 chars/token
 */
export function estimateTokens(content: string): number {
  const words = content.split(/\s+/).length
  const chars = content.length
  return Math.ceil(Math.max(words * 1.3, chars / 4))
}

/**
 * Split a section by heading level
 */
function splitByHeading(content: string, level: number): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = []
  const lines = content.split('\n')
  const headingPattern = new RegExp(`^${'#'.repeat(level)}\\s+(.+)$`)
  
  let currentHeading = ''
  let currentContent: string[] = []
  
  for (const line of lines) {
    const match = line.match(headingPattern)
    if (match) {
      // Save previous section
      if (currentHeading || currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n')
        })
      }
      // Start new section
      currentHeading = match[1]
      currentContent = [line]
    } else {
      currentContent.push(line)
    }
  }
  
  // Save last section
  if (currentHeading || currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n')
    })
  }
  
  return sections
}

/**
 * Split by paragraph boundaries
 */
function splitByParagraphs(content: string, maxTokens: number): string[] {
  const paragraphs = content.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const para of paragraphs) {
    const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + para
    if (estimateTokens(testChunk) > maxTokens && currentChunk) {
      chunks.push(currentChunk)
      currentChunk = para
    } else {
      currentChunk = testChunk
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk)
  }
  
  return chunks
}

/**
 * Chunk a document into smaller pieces based on token limits
 */
export function chunkDocument(
  content: string,
  title: string,
  config: Partial<ChunkerConfig> = {}
): Chunk[] {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const tokens = estimateTokens(content)
  
  // If under max, return as single chunk
  if (tokens <= cfg.maxTokens) {
    return [{
      id: slugify(title),
      title,
      content,
      level: 1,
      estimatedTokens: tokens
    }]
  }
  
  // Try splitting by H2
  const h2Sections = splitByHeading(content, 2)
  
  if (h2Sections.length > 1) {
    const chunks: Chunk[] = []
    
    for (const section of h2Sections) {
      const sectionTokens = estimateTokens(section.content)
      
      if (sectionTokens <= cfg.maxTokens) {
        // Section fits, add it
        chunks.push({
          id: `${slugify(title)}-${slugify(section.heading || 'intro')}`,
          title: section.heading || title,
          content: section.content,
          level: 2,
          estimatedTokens: sectionTokens
        })
      } else {
        // Section too large, try splitting by H3
        const h3Sections = splitByHeading(section.content, 3)
        
        if (h3Sections.length > 1) {
          for (const h3Section of h3Sections) {
            const h3Tokens = estimateTokens(h3Section.content)
            
            if (h3Tokens <= cfg.maxTokens) {
              chunks.push({
                id: `${slugify(title)}-${slugify(section.heading)}-${slugify(h3Section.heading || 'intro')}`,
                title: h3Section.heading || section.heading,
                content: h3Section.content,
                level: 3,
                estimatedTokens: h3Tokens
              })
            } else {
              // Still too large, split by paragraphs
              const paraChunks = splitByParagraphs(h3Section.content, cfg.maxTokens)
              paraChunks.forEach((para, idx) => {
                chunks.push({
                  id: `${slugify(title)}-${slugify(section.heading)}-${slugify(h3Section.heading)}-${idx + 1}`,
                  title: `${h3Section.heading || section.heading} (Part ${idx + 1})`,
                  content: para,
                  level: 3,
                  estimatedTokens: estimateTokens(para)
                })
              })
            }
          }
        } else {
          // No H3s, split by paragraphs
          const paraChunks = splitByParagraphs(section.content, cfg.maxTokens)
          paraChunks.forEach((para, idx) => {
            chunks.push({
              id: `${slugify(title)}-${slugify(section.heading)}-${idx + 1}`,
              title: `${section.heading} (Part ${idx + 1})`,
              content: para,
              level: 2,
              estimatedTokens: estimateTokens(para)
            })
          })
        }
      }
    }
    
    return mergeSmallChunks(chunks, cfg.minTokens)
  }
  
  // No H2 sections, split by paragraphs
  const paraChunks = splitByParagraphs(content, cfg.maxTokens)
  return paraChunks.map((para, idx) => ({
    id: `${slugify(title)}-${idx + 1}`,
    title: `${title} (Part ${idx + 1})`,
    content: para,
    level: 1,
    estimatedTokens: estimateTokens(para)
  }))
}

/**
 * Merge small adjacent chunks to avoid over-fragmentation
 */
function mergeSmallChunks(chunks: Chunk[], minTokens: number): Chunk[] {
  if (chunks.length <= 1) return chunks
  
  const merged: Chunk[] = []
  let i = 0
  
  while (i < chunks.length) {
    const current = chunks[i]
    
    // If current is small and there's a next chunk
    if (current.estimatedTokens < minTokens && i + 1 < chunks.length) {
      const next = chunks[i + 1]
      
      // Merge if combined size is reasonable
      const combinedTokens = current.estimatedTokens + next.estimatedTokens
      if (combinedTokens <= cfg.maxTokens) {
        merged.push({
          id: current.id,
          title: current.title,
          content: current.content + '\n\n' + next.content,
          level: Math.min(current.level, next.level),
          estimatedTokens: combinedTokens
        })
        i += 2
        continue
      }
    }
    
    merged.push(current)
    i++
  }
  
  return merged
}
