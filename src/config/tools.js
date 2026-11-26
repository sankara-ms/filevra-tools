// Compatibility layer: the registry is the single source of truth for tools.
export {
  TOOLS,
  TOOL_BY_ID,
  TOOL_BY_PATH,
  POPULAR_TOOLS,
  GENERIC_TOOLS,
  CATEGORIES,
  CATEGORY_BY_ID,
  getToolByPath,
  getCategoryTools,
  getRelatedTools,
  searchTools,
} from './toolRegistry'

export const GUIDES = [
  {
    id: 'image-preparation-guide',
    path: '/image-preparation-guide',
    name: 'Image Preparation Guide',
    description: 'How pixel dimensions, file size and compression interact when preparing a photo or signature.',
    icon: 'Image',
  },
  {
    id: 'pdf-preparation-guide',
    path: '/pdf-preparation-guide',
    name: 'PDF Preparation Guide',
    description: 'A practical explanation of PDF structure, size limits, merging and compression trade-offs.',
    icon: 'FileText',
  },
]
