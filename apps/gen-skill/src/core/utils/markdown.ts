import TurndownService from 'turndown'

/**
 * Convert HTML to Markdown
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })
  
  return turndownService.turndown(html)
}

/**
 * Clean markdown by removing unwanted elements
 */
export function cleanMarkdown(md: string): string {
  let cleaned = md
  
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove empty links
  cleaned = cleaned.replace(/\[([^\]]+)\]\(\s*\)/g, '$1')
  
  // Remove excessive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // Trim
  cleaned = cleaned.trim()
  
  return cleaned
}

/**
 * Extract the first paragraph from markdown
 */
export function extractFirstParagraph(md: string): string {
  const lines = md.split('\n')
  const paragraphs: string[] = []
  let currentParagraph = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip headings
    if (trimmed.startsWith('#')) {
      continue
    }
    
    // If empty line and we have a paragraph, save it
    if (trimmed === '') {
      if (currentParagraph) {
        paragraphs.push(currentParagraph)
        break
      }
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + trimmed
    }
  }
  
  // If we didn't break, add the last paragraph
  if (currentParagraph && paragraphs.length === 0) {
    paragraphs.push(currentParagraph)
  }
  
  return paragraphs[0] || ''
}

/**
 * Extract all headings from markdown
 */
export function extractHeadings(md: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = []
  const lines = md.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim()
      })
    }
  }
  
  return headings
}
