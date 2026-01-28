import type { LlmsTxtMeta, ParsedLlmsTxt, DocEntry } from '../types'

/**
 * Parse llms.txt format
 * 
 * Format:
 * # Site Name                     → meta.name
 * > Site description              → meta.description
 * 
 * ## Category Name                → entry.category
 * - [Title](url): Description     → { title, url, description, category }
 */
export function parseLlmsTxt(content: string): ParsedLlmsTxt {
  const lines = content.split('\n')
  
  const meta: LlmsTxtMeta = {
    name: '',
    description: ''
  }
  
  const entries: DocEntry[] = []
  let currentCategory = 'General'
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (!line) continue
    
    // H1 - Site name
    if (line.startsWith('# ')) {
      meta.name = line.substring(2).trim()
      continue
    }
    
    // Blockquote - Site description
    if (line.startsWith('> ')) {
      meta.description += (meta.description ? ' ' : '') + line.substring(2).trim()
      continue
    }
    
    // H2 - Category
    if (line.startsWith('## ')) {
      currentCategory = line.substring(3).trim()
      continue
    }
    
    // List item - Entry
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const entryText = line.substring(2).trim()
      
      // Match pattern: [Title](url): Description
      // or: [Title](url)
      const match = entryText.match(/\[([^\]]+)\]\(([^)]+)\)(?::\s*(.+))?/)
      
      if (match) {
        entries.push({
          title: match[1].trim(),
          url: match[2].trim(),
          description: match[3]?.trim() || '',
          category: currentCategory
        })
      }
    }
  }
  
  return { meta, entries }
}
