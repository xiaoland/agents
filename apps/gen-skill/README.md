# Agent Skill Generator

Convert documentation sites into Agent Skills that can be used with AI agents.

## Overview

This application generates Agent Skills from documentation websites. It discovers documentation structure via `llms.txt` or `llms-full.txt` files, fetches the documentation, processes it, and packages it into a ZIP file containing:

- `SKILL.md` - Main skill description with references
- `references/` - Directory with categorized documentation files

## Features

- 🔍 **Auto-discovery**: Automatically discovers documentation structure from llms.txt
- 📦 **Smart chunking**: Splits large documents into manageable chunks (3000-6000 tokens)
- 🧹 **Content cleaning**: Converts HTML to Markdown and removes unnecessary elements
- 📊 **Progress tracking**: Real-time progress updates during document fetching
- 💾 **ZIP export**: Packages everything into a downloadable ZIP file

## Requirements

- Node.js 18+ 
- npm or pnpm

## Installation

```bash
cd apps/gen-skill
npm install
```

## Usage

### Development

Start the development server:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Building

Build for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Using the Application

1. **Enter URL**: Input the base URL of a documentation site (e.g., `example.com`)
2. **Discover**: The app will look for `llms.txt` or `llms-full.txt`
3. **Review**: Check the discovered documentation entries
4. **Fetch & Generate**: Click to fetch all documents and generate the skill
5. **Preview**: Review the generated skill structure
6. **Export**: Download the ZIP file containing SKILL.md and references

## Supported Sites

Only documentation sites that provide:
- `llms.txt` file at the root (e.g., `https://example.com/llms.txt`)
- OR `llms-full.txt` file at the root

The llms.txt format should follow:

```markdown
# Site Name
> Site description

## Category Name
- [Page Title](url): Page description
- [Another Page](url): Another description
```

## Technical Details

### Architecture

The application is built with:
- **Vue 3** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **JSZip** - ZIP file generation
- **Turndown** - HTML to Markdown conversion

### Project Structure

```
src/
├── client/           # Vue application
│   ├── components/  # UI components
│   ├── composables/ # Vue composables
│   ├── App.vue      # Main app component
│   └── main.ts      # Entry point
├── core/            # Core logic (reusable)
│   ├── types/       # TypeScript types
│   └── utils/       # Utilities
└── worker/          # Cloudflare Worker (future)
```

### Key Components

- **useDocSiteDiscovery**: Discovers documentation sites via llms.txt
- **useDocFetcher**: Fetches documents with concurrency control
- **useDocParser**: Parses and cleans document content
- **useSkillGenerator**: Generates SKILL.md and references
- **useZipExporter**: Creates ZIP packages

## Limitations

- Only works with sites that have llms.txt or enable CORS
- MVP targets sites like ai-sdk.dev
- Large files are automatically split into chunks
- HTML content is converted to Markdown (some formatting may be lost)

## Development

The codebase follows the L2-PLAN.md design document located at:
`apps/gen-skill/docs/task/initial/L2-PLAN.md`

## License

See repository license.
