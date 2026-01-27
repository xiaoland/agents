import { ref } from 'vue'
import JSZip from 'jszip'
import type { SkillPackage } from '@/core/types'

export interface UseZipExporterReturn {
  exportZip: (pkg: SkillPackage, filename?: string) => Promise<void>
  loading: Readonly<typeof loading>
}

export function useZipExporter(): UseZipExporterReturn {
  const loading = ref(false)

  /**
   * Export skill package as ZIP file
   */
  async function exportZip(pkg: SkillPackage, filename: string = 'skill'): Promise<void> {
    loading.value = true

    try {
      const zip = new JSZip()

      // Add SKILL.md
      zip.file('SKILL.md', pkg.skillMd)

      // Add all references
      for (const ref of pkg.references) {
        zip.file(ref.path, ref.content)
      }

      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' })

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      loading.value = false
    }
  }

  return {
    exportZip,
    loading
  }
}
