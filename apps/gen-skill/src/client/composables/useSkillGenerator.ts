import type { ParsedDoc, SkillMeta, SkillPackage, SkillReference } from '@/core/types'
import { slugify } from '@/core/utils/slug'

export interface UseSkillGeneratorReturn {
  generate: (docs: ParsedDoc[], meta: SkillMeta) => SkillPackage
}

export function useSkillGenerator(): UseSkillGeneratorReturn {
  /**
   * Generate SKILL.md content
   */
  function generateSkillMd(docs: ParsedDoc[], meta: SkillMeta): string {
    const slugifiedName = slugify(meta.name)
    
    // Group docs by category
    const categories = new Map<string, ParsedDoc[]>()
    for (const doc of docs) {
      const categoryKey = doc.category.join('/')
      if (!categories.has(categoryKey)) {
        categories.set(categoryKey, [])
      }
      categories.get(categoryKey)!.push(doc)
    }

    // Build references section
    let referencesSection = '## References\n\nUse these references for detailed information:\n\n'
    
    for (const [categoryPath, categoryDocs] of categories) {
      const categoryName = categoryDocs[0].category[categoryDocs[0].category.length - 1]
      referencesSection += `### ${categoryName}\n`
      
      for (const doc of categoryDocs) {
        const refPath = `references/${doc.category.join('/')}/${doc.id}.md`
        referencesSection += `- \`${refPath}\`: ${doc.title}\n`
      }
      
      referencesSection += '\n'
    }

    // Extract overview from first doc or use description
    let overview = meta.description
    if (docs.length > 0) {
      const firstDoc = docs[0]
      const lines = firstDoc.content.split('\n').slice(0, 5).join('\n')
      if (lines.length > overview.length) {
        overview = lines.substring(0, 500) + (lines.length > 500 ? '...' : '')
      }
    }

    return `---
name: ${slugifiedName}
description: ${meta.description}
${meta.version ? `version: ${meta.version}` : ''}
---

# ${meta.name}

> ${meta.description}

Source: ${meta.sourceUrl}

## Overview

${overview}

${referencesSection}

## Usage

Refer to the references above for detailed API documentation and guides.
`
  }

  /**
   * Generate skill package
   */
  function generate(docs: ParsedDoc[], meta: SkillMeta): SkillPackage {
    const skillMd = generateSkillMd(docs, meta)
    
    const references: SkillReference[] = docs.map(doc => ({
      path: `references/${doc.category.join('/')}/${doc.id}.md`,
      content: `# ${doc.title}

Source: ${doc.originalUrl}

${doc.content}
`,
      title: doc.title
    }))

    return {
      skillMd,
      references
    }
  }

  return {
    generate
  }
}
