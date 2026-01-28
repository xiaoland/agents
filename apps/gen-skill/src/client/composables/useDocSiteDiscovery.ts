import { ref } from 'vue'
import type { DiscoveryResult, DocSiteType } from '@/core/types'
import { parseLlmsTxt } from '@/core/utils/llms-txt-parser'

export interface UseDocSiteDiscoveryReturn {
  discover: (baseUrl: string) => Promise<DiscoveryResult>
  loading: Readonly<typeof loading>
  error: Readonly<typeof error>
}

export function useDocSiteDiscovery(): UseDocSiteDiscoveryReturn {
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Normalize URL by removing trailing slashes and ensuring protocol
   */
  function normalizeUrl(url: string): string {
    let normalized = url.trim()
    
    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '')
    
    return normalized
  }

  /**
   * Discover documentation site structure
   */
  async function discover(baseUrl: string): Promise<DiscoveryResult> {
    loading.value = true
    error.value = null

    try {
      const normalized = normalizeUrl(baseUrl)
      
      // Try to fetch llms.txt
      const llmsTxtUrl = `${normalized}/llms.txt`
      const llmsFullTxtUrl = `${normalized}/llms-full.txt`
      
      let type: DocSiteType = 'unknown'
      let rawContent = ''
      let parsedData = { meta: { name: '', description: '' }, entries: [] }
      
      // Try llms-full.txt first (more comprehensive)
      try {
        const response = await fetch(llmsFullTxtUrl)
        if (response.ok) {
          rawContent = await response.text()
          parsedData = parseLlmsTxt(rawContent)
          type = 'llms-full'
        }
      } catch (e) {
        // Ignore and try llms.txt
      }
      
      // If llms-full.txt not found, try llms.txt
      if (type === 'unknown') {
        try {
          const response = await fetch(llmsTxtUrl)
          if (response.ok) {
            rawContent = await response.text()
            parsedData = parseLlmsTxt(rawContent)
            type = 'llms-txt'
          }
        } catch (e) {
          // Site doesn't support llms.txt
        }
      }

      return {
        type,
        baseUrl: normalized,
        llmsTxtUrl: type === 'llms-txt' || type === 'llms-full' ? llmsTxtUrl : null,
        llmsFullTxtUrl: type === 'llms-full' ? llmsFullTxtUrl : null,
        entries: parsedData.entries,
        rawContent
      }
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    discover,
    loading,
    error
  }
}
