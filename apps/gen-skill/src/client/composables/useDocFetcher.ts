import { ref } from 'vue'
import type { DocEntry, FetchedDoc, FetchProgress } from '@/core/types'

export interface UseDocFetcherReturn {
  fetchAll: (entries: DocEntry[]) => Promise<FetchedDoc[]>
  fetchOne: (entry: DocEntry) => Promise<FetchedDoc>
  progress: Readonly<typeof progress>
  abort: () => void
  loading: Readonly<typeof loading>
}

const CONCURRENT_LIMIT = 5
const TIMEOUT_MS = 30000
const RETRY_COUNT = 1

export function useDocFetcher(): UseDocFetcherReturn {
  const loading = ref(false)
  const progress = ref<FetchProgress>({
    total: 0,
    completed: 0,
    current: '',
    errors: []
  })
  
  let abortController: AbortController | null = null

  /**
   * Fetch a single document with timeout and retry
   */
  async function fetchOne(entry: DocEntry): Promise<FetchedDoc> {
    const fetchWithTimeout = async (url: string, retries = RETRY_COUNT): Promise<Response> => {
      for (let i = 0; i <= retries; i++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
          
          const response = await fetch(url, {
            signal: abortController?.signal || controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            return response
          }
          
          if (i === retries) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (e) {
          if (i === retries) {
            throw e
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
      throw new Error('Failed to fetch')
    }

    try {
      let url = entry.url
      let contentType: 'markdown' | 'html' = 'html'
      
      // Try .md extension first
      if (url.endsWith('.md')) {
        contentType = 'markdown'
      } else {
        // Try appending .md
        try {
          const mdResponse = await fetchWithTimeout(`${url}.md`, 1)
          url = `${url}.md`
          contentType = 'markdown'
        } catch (e) {
          // Fall back to original URL
        }
      }
      
      const response = await fetchWithTimeout(url)
      const content = await response.text()
      
      return {
        entry,
        content,
        contentType,
        fetchedAt: Date.now()
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      return {
        entry,
        content: '',
        contentType: 'html',
        fetchedAt: Date.now(),
        error: errorMsg
      }
    }
  }

  /**
   * Fetch all documents with concurrency control
   */
  async function fetchAll(entries: DocEntry[]): Promise<FetchedDoc[]> {
    loading.value = true
    abortController = new AbortController()
    
    progress.value = {
      total: entries.length,
      completed: 0,
      current: '',
      errors: []
    }

    const results: FetchedDoc[] = []
    const queue = [...entries]
    const inProgress: Promise<void>[] = []

    const processNext = async () => {
      while (queue.length > 0) {
        const entry = queue.shift()!
        progress.value.current = entry.url

        try {
          const doc = await fetchOne(entry)
          results.push(doc)
          
          if (doc.error) {
            progress.value.errors.push(`${entry.url}: ${doc.error}`)
          }
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e)
          progress.value.errors.push(`${entry.url}: ${errorMsg}`)
        }

        progress.value.completed++
      }
    }

    // Start concurrent workers
    for (let i = 0; i < Math.min(CONCURRENT_LIMIT, entries.length); i++) {
      inProgress.push(processNext())
    }

    await Promise.all(inProgress)

    loading.value = false
    abortController = null

    return results
  }

  /**
   * Abort ongoing fetches
   */
  function abort() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    loading.value = false
  }

  return {
    fetchAll,
    fetchOne,
    progress,
    abort,
    loading
  }
}
